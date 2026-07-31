// src/app/page.tsx
'use client';

export default function Home() {
  // Cursor position state for interactive parallax animations
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const router = useRouter();

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const user = api.auth.getLocalUser();

    if (user?.role) {
      if (
        user.role === 'Admin' ||
        user.role === 'Fleet Manager' ||
        user.role === 'Manager'
      ) {
        router.replace('/dashboard');
      } else {
        router.replace('/driver');
      }
    } else {
      // Invalid auth state - clear and redirect to login
      api.auth.logout();
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}