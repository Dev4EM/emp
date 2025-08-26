import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../components/Api';
import { Visibility, VisibilityOff } from '@mui/icons-material'; // Material-UI icons

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/');
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const response = await loginUser({ workEmail: email, password });
      const { token } = response;
      if (!token) throw new Error('No token in response');
      localStorage.setItem('token', token);
      setSuccess('Login Successful! Redirecting...');
      setError('');
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-josefin w-full flex items-center justify-center bg-gradient-to-tr from-emerald-900 via-emerald-700 to-gray-900 px-4 py-12 relative overflow-hidden">

     
      <div className="relative flex w-full max-w-4xl items-stretch shadow-2xl rounded-3xl overflow-hidden">
        {/* Branding Section */}
        <div className="hidden lg:flex flex-col justify-between items-center bg-gradient-to-tr from-emerald-900 to-emerald-600 px-12 py-16 w-3/5 min-h-[500px] text-white z-10">
          <div className="flex flex-col items-center gap-2">
            <img src="./esroMagicaSpLogo.png" width={80} alt="EM Logo" className="rounded-lg bg-black p-2 shadow-md" />
            <span className="text-4xl font-extrabold tracking-tight">
              <span className="text-orange-400">EM</span> People
            </span>
          </div>
          <div className="mt-16">
            <h2 className="text-3xl font-bold leading-snug">Explore the Universe<br />of Productivity</h2>
            <p className="mt-4 text-lg text-emerald-100">Powered by EM People from the Earth</p>
          </div>
          <div className="mt-16 text-emerald-200 font-bold text-lg text-center">
            <span>LAUNCH YOUR JOURNEY!<br />LOG IN AND CONTINUE ORBITING</span>
          </div>
        </div>

        {/* Login Form Section */}
        <div className="flex flex-col justify-center bg-gray-950/80 backdrop-blur-sm px-8 py-12 w-full lg:w-3/5 z-10">
          <div className="flex flex-col gap-4 items-center mb-8 lg:hidden">
            <img
              src="./esroMagicaSpLogo.png"
              width={65}
              className="rounded-lg bg-black p-2 shadow-md mb-2"
              alt="EM Logo"
            />
            <h2 className="text-3xl font-extrabold text-emerald-400 text-center">
              Welcome! <span className="text-orange-400">EM</span> People
            </h2>
            <p className="mt-2 text-gray-400 text-center">Sign in to continue</p>
          </div>

          <div className="hidden lg:flex flex-col gap-4 items-center mb-8">
            <h2 className="text-3xl font-extrabold text-emerald-400 text-center">
              Welcome Back!
            </h2>
            <p className="mt-2 text-gray-400 text-center">Sign in to your account</p>
          </div>

          {/* Notification/Errors */}
          <div className="mb-4 min-h-[48px] w-full">
            {error && (
              <div className="p-3 text-sm text-red-300 bg-red-900/60 border border-red-500/40 rounded-lg animate-pulse">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-green-300 bg-green-900/60 border border-green-500/40 rounded-lg animate-pulse">
                {success}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-sm mx-auto">
            {/* Email */}
            <div className="flex flex-col items-start">
              <label className="text-sm font-semibold text-gray-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 px-4 bg-gray-900/90 border border-gray-700 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 text-white transition-all duration-200"
                placeholder="your@email.com"
                autoComplete="username"
                required
              />
            </div>

            {/* Password */}
            <div className="flex flex-col relative items-start">
              <label className="text-sm font-semibold text-gray-400 mb-2">
                Password
              </label>
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 px-4 pr-12 bg-gray-900/90 border border-gray-700 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 text-white transition-all duration-200"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-10 text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <VisibilityOff /> : <Visibility />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <a href="#" className="text-sm font-medium text-emerald-400 hover:text-orange-400 transition-colors duration-200">
                {/* Forgot password? */}
              </a>
            </div>

            <button
              type="submit"
              className="w-full py-3 font-semibold bg-gradient-to-r from-emerald-600 to-orange-500 rounded-lg text-white shadow-lg hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-emerald-500/50 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
