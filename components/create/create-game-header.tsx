interface CreateGameHeaderProps {
  shouldSkipNicknameInput: boolean;
}

export function CreateGameHeader({
  shouldSkipNicknameInput,
}: CreateGameHeaderProps) {
  return (
    <div className="text-center space-y-2">
      <h1 className="text-2xl font-bold">Create Game</h1>
      <p className="text-muted-foreground">
        {shouldSkipNicknameInput
          ? "Ready to create your game"
          : "Enter your name to start"}
      </p>
    </div>
  );
}
