export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <h1 className="text-foreground text-4xl font-semibold tracking-tight">
        Sebavio
      </h1>
      <p className="mt-3 max-w-md text-center text-lg text-zinc-600 dark:text-zinc-400">
        Compagnon de voyage intelligent — fondations du projet.
      </p>
      <p className="mt-8 flex gap-4 text-sm">
        <a
          href="/login"
          className="text-primary underline-offset-4 hover:underline"
        >
          Connexion
        </a>
        <a
          href="/register"
          className="text-primary underline-offset-4 hover:underline"
        >
          Inscription
        </a>
      </p>
    </main>
  );
}
