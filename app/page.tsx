import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Poker Accounting</h1>
          <p className="text-muted-foreground">
            Create a game or join an existing session
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <Link href="/create">Create Game</Link>
          </Button>
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/join">Join Game</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
