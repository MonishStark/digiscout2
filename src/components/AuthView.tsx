/** @format */

import React, { useState, useEffect } from "react";

const API_URL =
	((import.meta as any).env?.VITE_API_URL as string | undefined) ||
	"http://localhost:5001";

interface AuthViewProps {
	onAuthSuccess: (user: { id: string; name: string; email: string }, token: string) => void;
	initialResetToken?: string | null;
	onClearResetToken?: () => void;
}

type AuthMode = "login" | "register" | "otp" | "forgot" | "reset";

export const AuthView: React.FC<AuthViewProps> = ({
	onAuthSuccess,
	initialResetToken,
	onClearResetToken,
}) => {
	const [mode, setMode] = useState<AuthMode>("login");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [otp, setOtp] = useState("");
	const [resetToken, setResetToken] = useState(initialResetToken || "");
	
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (initialResetToken) {
			setMode("reset");
			setResetToken(initialResetToken);
		}
	}, [initialResetToken]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setMessage("");
		setLoading(true);

		try {
			if (mode === "login") {
				const resp = await fetch(`${API_URL}/api/auth/login`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, password }),
				});
				const data = await resp.json();
				if (!resp.ok) {
					if (data.status === "unverified") {
						setEmail(data.email || email);
						setMode("otp");
						throw new Error(data.error || "Please verify your email address.");
					}
					throw new Error(data.error || "Login failed");
				}
				localStorage.setItem("ds_token", data.token);
				onAuthSuccess(data.user, data.token);
			} else if (mode === "register") {
				if (password !== confirmPassword) {
					throw new Error("Passwords do not match");
				}
				const resp = await fetch(`${API_URL}/api/auth/register`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name, email, password }),
				});
				const data = await resp.json();
				if (!resp.ok) {
					throw new Error(data.error || "Registration failed");
				}
				setMessage(data.message || "OTP code sent to email.");
				setMode("otp");
			} else if (mode === "otp") {
				const resp = await fetch(`${API_URL}/api/auth/verify-otp`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, otp }),
				});
				const data = await resp.json();
				if (!resp.ok) {
					throw new Error(data.error || "OTP verification failed");
				}
				localStorage.setItem("ds_token", data.token);
				onAuthSuccess(data.user, data.token);
			} else if (mode === "forgot") {
				const resp = await fetch(`${API_URL}/api/auth/forgot-password`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email }),
				});
				const data = await resp.json();
				if (!resp.ok) {
					throw new Error(data.error || "Password reset request failed");
				}
				setMessage(data.message || "Reset link sent to your email.");
			} else if (mode === "reset") {
				if (password !== confirmPassword) {
					throw new Error("Passwords do not match");
				}
				const resp = await fetch(`${API_URL}/api/auth/reset-password`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ token: resetToken, password }),
				});
				const data = await resp.json();
				if (!resp.ok) {
					throw new Error(data.error || "Password reset failed");
				}
				setMessage("Password updated successfully. You can now log in.");
				setMode("login");
				if (onClearResetToken) {
					onClearResetToken();
				}
			}
		} catch (err: any) {
			setError(err.message || "Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleResendOtp = async () => {
		setError("");
		setMessage("");
		setLoading(true);
		try {
			const resp = await fetch(`${API_URL}/api/auth/resend-otp`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
			const data = await resp.json();
			if (!resp.ok) {
				throw new Error(data.error || "Failed to resend OTP");
			}
			setMessage("A new OTP verification code has been sent to your email.");
		} catch (err: any) {
			setError(err.message || "Failed to resend code.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-container">
			<style>{`
				.auth-container {
					display: flex;
					align-items: center;
					justify-content: center;
					min-height: 100vh;
					background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
					font-family: 'Inter', system-ui, -apple-system, sans-serif;
					padding: 24px;
					color: #f8fafc;
				}
				.auth-card {
					width: 100%;
					max-width: 440px;
					background: rgba(30, 41, 59, 0.7);
					backdrop-filter: blur(16px);
					border: 1px solid rgba(255, 255, 255, 0.08);
					border-radius: 24px;
					padding: 40px;
					box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
					animation: authFadeIn 0.5s ease-out;
				}
				@keyframes authFadeIn {
					from { opacity: 0; transform: translateY(20px); }
					to { opacity: 1; transform: translateY(0); }
				}
				.auth-logo {
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 8px;
					font-size: 24px;
					font-weight: 800;
					color: #6366f1;
					margin-bottom: 8px;
					letter-spacing: -0.5px;
				}
				.auth-logo span {
					color: #38bdf8;
				}
				.auth-title {
					font-size: 20px;
					font-weight: 700;
					text-align: center;
					color: #ffffff;
					margin-bottom: 24px;
				}
				.auth-form {
					display: flex;
					flex-direction: column;
					gap: 16px;
				}
				.auth-group {
					display: flex;
					flex-direction: column;
					gap: 6px;
				}
				.auth-label {
					font-size: 13px;
					font-weight: 600;
					color: #94a3b8;
				}
				.auth-input {
					background: rgba(15, 23, 42, 0.6);
					border: 1px solid rgba(255, 255, 255, 0.1);
					border-radius: 12px;
					padding: 12px 16px;
					color: #ffffff;
					font-size: 15px;
					transition: all 0.2s ease;
				}
				.auth-input:focus {
					outline: none;
					border-color: #6366f1;
					box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
				}
				.auth-btn {
					background: linear-gradient(90deg, #6366f1 0%, #4f46e5 100%);
					border: none;
					border-radius: 12px;
					color: #ffffff;
					font-size: 15px;
					font-weight: 600;
					padding: 14px;
					cursor: pointer;
					transition: all 0.2s ease;
					margin-top: 8px;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				.auth-btn:hover {
					opacity: 0.95;
					transform: translateY(-1px);
					box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
				}
				.auth-btn:disabled {
					opacity: 0.6;
					cursor: not-allowed;
					transform: none;
				}
				.auth-switch {
					text-align: center;
					font-size: 14px;
					color: #94a3b8;
					margin-top: 16px;
				}
				.auth-link {
					color: #38bdf8;
					cursor: pointer;
					font-weight: 600;
					text-decoration: none;
					transition: color 0.2s;
				}
				.auth-link:hover {
					color: #6366f1;
				}
				.auth-alert-error {
					background: rgba(239, 68, 68, 0.15);
					border: 1px solid rgba(239, 68, 68, 0.3);
					color: #fca5a5;
					padding: 12px;
					border-radius: 12px;
					font-size: 14px;
					text-align: center;
				}
				.auth-alert-success {
					background: rgba(16, 185, 129, 0.15);
					border: 1px solid rgba(16, 185, 129, 0.3);
					color: #a7f3d0;
					padding: 12px;
					border-radius: 12px;
					font-size: 14px;
					text-align: center;
				}
				.otp-resend-container {
					text-align: center;
					margin-top: 12px;
					font-size: 14px;
				}
			`}</style>

			<div className="auth-card">
				<div className="auth-logo">
					⚡ Digital<span>Scout</span>
				</div>

				<h2 className="auth-title">
					{mode === "login" && "Welcome Back"}
					{mode === "register" && "Create Your Account"}
					{mode === "otp" && "Verify Your Email"}
					{mode === "forgot" && "Reset Password Request"}
					{mode === "reset" && "Set New Password"}
				</h2>

				{error && <div className="auth-alert-error" id="auth-error-msg">{error}</div>}
				{message && <div className="auth-alert-success" id="auth-success-msg">{message}</div>}

				<form onSubmit={handleSubmit} className="auth-form">
					{mode === "register" && (
						<div className="auth-group">
							<label className="auth-label" htmlFor="register-name-input">Full Name</label>
							<input
								id="register-name-input"
								type="text"
								className="auth-input"
								placeholder="John Doe"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>
					)}

					{(mode === "login" || mode === "register" || mode === "forgot") && (
						<div className="auth-group">
							<label className="auth-label" htmlFor="auth-email-input">Email Address</label>
							<input
								id="auth-email-input"
								type="email"
								className="auth-input"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
					)}

					{(mode === "login" || mode === "register" || mode === "reset") && (
						<div className="auth-group">
							<label className="auth-label" htmlFor="auth-password-input">Password</label>
							<input
								id="auth-password-input"
								type="password"
								className="auth-input"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
					)}

					{(mode === "register" || mode === "reset") && (
						<div className="auth-group">
							<label className="auth-label" htmlFor="auth-confirm-password-input">Confirm Password</label>
							<input
								id="auth-confirm-password-input"
								type="password"
								className="auth-input"
								placeholder="••••••••"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
							/>
						</div>
					)}

					{mode === "otp" && (
						<div className="auth-group">
							<label className="auth-label" htmlFor="auth-otp-input">Verification Code (OTP)</label>
							<input
								id="auth-otp-input"
								type="text"
								maxLength={6}
								className="auth-input"
								placeholder="123456"
								style={{ textAlign: "center", fontSize: "20px", letterSpacing: "8px" }}
								value={otp}
								onChange={(e) => setOtp(e.target.value)}
								required
							/>
						</div>
					)}

					<button
						id="auth-submit-btn"
						type="submit"
						className="auth-btn"
						disabled={loading}
					>
						{loading ? "Processing..." : (
							<>
								{mode === "login" && "Log In"}
								{mode === "register" && "Register"}
								{mode === "otp" && "Verify & Register"}
								{mode === "forgot" && "Send Reset Link"}
								{mode === "reset" && "Reset Password"}
							</>
						)}
					</button>
				</form>

				{mode === "login" && (
					<>
						<div className="auth-switch">
							Don't have an account?{" "}
							<span
								id="toggle-to-register"
								className="auth-link"
								onClick={() => {
									setError("");
									setMessage("");
									setMode("register");
								}}
							>
								Sign Up
							</span>
						</div>
						<div className="auth-switch" style={{ marginTop: "8px" }}>
							<span
								id="toggle-to-forgot"
								className="auth-link"
								onClick={() => {
									setError("");
									setMessage("");
									setMode("forgot");
								}}
							>
								Forgot Password?
							</span>
						</div>
					</>
				)}

				{mode === "register" && (
					<div className="auth-switch">
						Already have an account?{" "}
						<span
							id="toggle-to-login"
							className="auth-link"
							onClick={() => {
								setError("");
								setMessage("");
								setMode("login");
							}}
						>
							Log In
						</span>
					</div>
				)}

				{mode === "otp" && (
					<>
						<div className="otp-resend-container">
							Didn't receive a code?{" "}
							<span
								id="auth-resend-otp-btn"
								className="auth-link"
								onClick={handleResendOtp}
							>
								Resend OTP
							</span>
						</div>
						<div className="auth-switch">
							Go back to{" "}
							<span
								className="auth-link"
								onClick={() => {
									setError("");
									setMessage("");
									setMode("login");
								}}
							>
								Log In
							</span>
						</div>
					</>
				)}

				{(mode === "forgot" || mode === "reset") && (
					<div className="auth-switch">
						Go back to{" "}
						<span
							className="auth-link"
							onClick={() => {
								setError("");
								setMessage("");
								setMode("login");
								if (onClearResetToken) onClearResetToken();
							}}
						>
							Log In
						</span>
					</div>
				)}
			</div>
		</div>
	);
};
