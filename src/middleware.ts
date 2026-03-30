import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login", // Redirect to login page if not authenticated
  },
});

export const config = {
  // Protect these routes - require authentication
  matcher: [
    "/dashboard/:path*",
    "/recordings/:path*",
    "/chat/:path*",
    "/settings/:path*",
  ],
};
