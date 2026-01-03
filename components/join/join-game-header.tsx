interface JoinGameHeaderProps {
  shouldSkipNicknameInput: boolean;
}

export function JoinGameHeader({ shouldSkipNicknameInput }: JoinGameHeaderProps) {
  return (
    <div className="text-center space-y-2">
      <h1 className="text-2xl font-bold">Join Game</h1>
      <p className="text-muted-foreground">
        {shouldSkipNicknameInput
          ? "Enter the game code to join"
          : "Enter the game code and your name"}
      </p>
    </div>
  );
}
