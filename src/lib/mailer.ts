/** @format */

import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Log sent emails locally for development if SMTP is not set up
function logEmailLocally(to: string, subject: string, body: string) {
	const logDir = path.join(process.cwd(), ".debug-generation");
	if (!fs.existsSync(logDir)) {
		fs.mkdirSync(logDir, { recursive: true });
	}
	const logPath = path.join(logDir, "sent_emails.log");
	const entry = `[${new Date().toISOString()}] To: ${to}\nSubject: ${subject}\nBody:\n${body}\n==================================================\n\n`;
	fs.appendFileSync(logPath, entry, "utf8");
	console.log(`[Mailer] Simulated email saved to ${logPath}`);
	console.log(`[Mailer] --- simulated email to ${to} ---`);
	console.log(`Subject: ${subject}`);
	console.log(body);
	console.log(`[Mailer] ---------------------------------`);
}

export async function sendEmail({
	to,
	subject,
	text,
	html,
}: {
	to: string;
	subject: string;
	text: string;
	html?: string;
}) {
	const host = process.env.SMTP_HOST;
	const port = parseInt(process.env.SMTP_PORT || "587", 10);
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	const from = process.env.SMTP_FROM || `"DigitalScout" <noreply@digiscout.online>`;

	if (!host || !user || !pass) {
		console.warn(`[Mailer] SMTP credentials missing in env. Simulating email send.`);
		logEmailLocally(to, subject, text || html || "");
		return { success: true, simulated: true };
	}

	try {
		const transporter = nodemailer.createTransport({
			host,
			port,
			secure: port === 465, // true for 465, false for other ports
			auth: {
				user,
				pass,
			},
		});

		const info = await transporter.sendMail({
			from,
			to,
			subject,
			text,
			html: html || text,
		});

		console.log(`[Mailer] Email sent: ${info.messageId}`);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error(`[Mailer] Failed to send email via SMTP:`, error);
		// Fallback to local logging on error so registration flow doesn't crash completely
		logEmailLocally(to, subject, text || html || "");
		return { success: false, error: error instanceof Error ? error.message : String(error) };
	}
}

export async function sendOTPEmail(email: string, otp: string) {
	const subject = `Your DigitalScout Verification Code: ${otp}`;
	const text = `Hello,

Your verification code is: ${otp}

Please enter this code on the verification screen to complete your registration. This code will expire in 15 minutes.

Best regards,
The DigitalScout Team`;

	const html = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
	<h2 style="color: #6366f1; margin-bottom: 24px;">Verify Your Email Address</h2>
	<p>Hello,</p>
	<p>Thank you for signing up with DigitalScout! To complete your registration, please use the following verification code:</p>
	<div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e1b4b; background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
		${otp}
	</div>
	<p style="color: #64748b; font-size: 14px;">This code will expire in 15 minutes. If you did not request this email, you can safely ignore it.</p>
	<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
	<p style="color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} DigitalScout. All rights reserved.</p>
</div>
	`;

	return sendEmail({ to: email, subject, text, html });
}

export async function sendResetPasswordEmail(email: string, resetLink: string) {
	const subject = `Reset Your DigitalScout Password`;
	const text = `Hello,

We received a request to reset your password. You can reset it using the following link:

${resetLink}

This link will expire in 1 hour. If you did not request this, please ignore this email.

Best regards,
The DigitalScout Team`;

	const html = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
	<h2 style="color: #6366f1; margin-bottom: 24px;">Reset Your Password</h2>
	<p>Hello,</p>
	<p>We received a request to reset your password for your DigitalScout account. Click the button below to reset it:</p>
	<div style="text-align: center; margin: 32px 0;">
		<a href="${resetLink}" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
	</div>
	<p>Or copy and paste this URL into your browser:</p>
	<p style="word-break: break-all; color: #6366f1; font-size: 14px;">${resetLink}</p>
	<p style="color: #64748b; font-size: 14px; margin-top: 24px;">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
	<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
	<p style="color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} DigitalScout. All rights reserved.</p>
</div>
	`;

	return sendEmail({ to: email, subject, text, html });
}
