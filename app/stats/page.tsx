"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/components/auth/auth-provider";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Target,
  AlertCircle,
  Flame,
} from "lucide-react";

interface UserStats {
  rank: number;
  nickname: string;
  totalNetEarnings: number;
  gamesPlayed: number;
  winRate: number;
  averageNetPerGame: number;
  totalBuyIns: number;
  totalFinals: number;
  recentGames: Array<{
    gameCode: string;
    netEarnings: number;
    date: string;
  }>;
  bestGame: { gameCode: string; netEarnings: number };
  worstGame: { gameCode: string; netEarnings: number };
  currentStreak: { type: "win" | "loss"; count: number };
}

// Mock personal statistics data
const mockUserStats: UserStats = {
  rank: 2,
  nickname: "PokerPro",
  totalNetEarnings: 980.25,
  gamesPlayed: 12,
  winRate: 66.7,
  averageNetPerGame: 81.69,
  totalBuyIns: 2400.0,
  totalFinals: 3380.25,
  recentGames: [
    { gameCode: "ABC12", netEarnings: 125.5, date: "2024-01-15" },
    { gameCode: "XYZ89", netEarnings: -50.0, date: "2024-01-12" },
    { gameCode: "DEF45", netEarnings: 200.0, date: "2024-01-10" },
    { gameCode: "GHI67", netEarnings: 75.25, date: "2024-01-08" },
    { gameCode: "JKL34", netEarnings: 150.0, date: "2024-01-05" },
  ],
  bestGame: { gameCode: "DEF45", netEarnings: 200.0 },
  worstGame: { gameCode: "XYZ89", netEarnings: -50.0 },
  currentStreak: { type: "win", count: 2 },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function StatsPage() {
  const session = authClient.useSession();
  const isAuthenticated = !!session.data?.user;

  return (
    <>
      <div className="flex justify-start items-center p-4">
        <Button variant="ghost" asChild>
          <Link href="/leaderboard">← Leaderboard</Link>
        </Button>
      </div>

      <div className="flex-1 p-4 pb-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <BarChart3 className="size-8 text-primary" />
              <h1 className="text-3xl font-bold">My Statistics</h1>
            </div>
            <p className="text-muted-foreground">
              Your performance overview and game history
            </p>
          </div>

          {!isAuthenticated ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-muted-foreground">
                Sign in to view your statistics
              </p>
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button variant="outline" asChild>
                  <Link href="/leaderboard">View Leaderboard</Link>
                </Button>
              </div>

              {/* Rank Badge */}
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Current Rank
                    </p>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className="text-lg px-3 py-1"
                      >
                        #{mockUserStats.rank}
                      </Badge>
                      <span className="text-xl font-semibold">
                        {mockUserStats.nickname}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">
                      Total Net Earnings
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        mockUserStats.totalNetEarnings >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {mockUserStats.totalNetEarnings >= 0 ? (
                        <TrendingUp className="inline size-5 mr-1" />
                      ) : (
                        <TrendingDown className="inline size-5 mr-1" />
                      )}
                      {formatCurrency(mockUserStats.totalNetEarnings)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="size-4" />
                    <span className="text-sm font-medium">Games Played</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {mockUserStats.gamesPlayed}
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Target className="size-4" />
                    <span className="text-sm font-medium">Win Rate</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatPercentage(mockUserStats.winRate)}
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="size-4" />
                    <span className="text-sm font-medium">Avg/Game</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(mockUserStats.averageNetPerGame)}
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Flame className="size-4" />
                    <span className="text-sm font-medium">Current Streak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">
                      {mockUserStats.currentStreak.count}
                    </p>
                    <Badge
                      variant={
                        mockUserStats.currentStreak.type === "win"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {mockUserStats.currentStreak.type === "win"
                        ? "Wins"
                        : "Losses"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Best and Worst Games */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <Trophy className="size-5 text-yellow-500" />
                    <span className="text-sm font-medium">Best Game</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">
                      {mockUserStats.bestGame.gameCode}
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(mockUserStats.bestGame.netEarnings)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <AlertCircle className="size-5 text-red-500" />
                    <span className="text-sm font-medium">Worst Game</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">
                      {mockUserStats.worstGame.gameCode}
                    </p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(mockUserStats.worstGame.netEarnings)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Games */}
              <div className="rounded-lg border bg-card">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Recent Games</h2>
                </div>
                <div className="divide-y">
                  {mockUserStats.recentGames.map((game, index) => (
                    <div
                      key={index}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{game.gameCode}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(game.date)}
                          </span>
                        </div>
                        <div
                          className={`font-semibold ${
                            game.netEarnings >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {game.netEarnings >= 0 ? (
                            <TrendingUp className="inline size-4 mr-1" />
                          ) : (
                            <TrendingDown className="inline size-4 mr-1" />
                          )}
                          {formatCurrency(game.netEarnings)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <span className="text-sm font-medium">Total Buy-ins</span>
                  </div>
                  <p className="text-xl font-semibold">
                    {formatCurrency(mockUserStats.totalBuyIns)}
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <span className="text-sm font-medium">Total Finals</span>
                  </div>
                  <p className="text-xl font-semibold">
                    {formatCurrency(mockUserStats.totalFinals)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
