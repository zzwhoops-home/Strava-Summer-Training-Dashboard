const dev = process.env.NODE_ENV !== 'production';

// put development server when ready. Maybe implement getting host directly from req
export const serverURL = dev ? "http://localhost:3000" : "https://strava-summer-training-dashboard.vercel.app";
export const requiredScopes = "read,activity:read_all";