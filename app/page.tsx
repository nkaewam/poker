import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth/auth-button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex justify-end p-4">
        <AuthButton />
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Image
            src="/poker-accounting.webp"
            alt="Poker Accounting"
            width={200}
            height={200}
            className="mx-auto"
          />
          <h1 className="text-3xl font-bold">Poker Accounting</h1>
          <p className="text-muted-foreground">
            Gambling without any headaches
          </p>
        </div>

        <div className="flex flex-col gap-2 items-center">
          <Button asChild className="w-full max-w-sm text-white" size="lg">
            <Link href="/create">Create Game</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full max-w-sm"
            size="lg"
          >
            <Link href="/join">Join Game</Link>
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
