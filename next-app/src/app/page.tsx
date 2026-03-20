import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Login.gov</h1>
      <p>Secure access to government services</p>
      <nav style={{ marginTop: '2rem' }}>
        <Link
          href="/login"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0050d8',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            marginRight: '1rem',
          }}
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#1b1b1b',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          Create an account
        </Link>
      </nav>
    </main>
  );
}
