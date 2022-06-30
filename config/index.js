const dev = process.env.NODE_ENV !== 'production';

// put development server when ready. Maybe implement getting host directly from req
export const server = dev ? "http://localhost:3000/" : ""