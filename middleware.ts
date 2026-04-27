import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  const { data } = await supabase.auth.getUser();

  const isAuthRoute = req.nextUrl.pathname.startsWith("/login");
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  if (!data.user && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (data.user && isAuthRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isAdminRoute && data.user) {
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", data.user.id).single();
    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
