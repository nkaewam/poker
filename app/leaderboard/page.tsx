"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth/auth-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/components/auth/auth-provider";
import { Trophy, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  totalNetEarnings: number;
  gamesPlayed: number;
  winRate: number;
  averageNetPerGame: number;
  totalBuyIns: number;
  totalFinals: number;
}

// Mock leaderboard data
const mockLeaderboardData: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "user1",
    nickname: "AceHigh",
    totalNetEarnings: 1250.5,
    gamesPlayed: 15,
    winRate: 73.3,
    averageNetPerGame: 83.37,
    totalBuyIns: 3000.0,
    totalFinals: 4250.5,
  },
  {
    rank: 2,
    userId: "user2",
    nickname: "PokerPro",
    totalNetEarnings: 980.25,
    gamesPlayed: 12,
    winRate: 66.7,
    averageNetPerGame: 81.69,
    totalBuyIns: 2400.0,
    totalFinals: 3380.25,
  },
  {
    rank: 3,
    userId: "user3",
    nickname: "CardShark",
    totalNetEarnings: 750.0,
    gamesPlayed: 18,
    winRate: 55.6,
    averageNetPerGame: 41.67,
    totalBuyIns: 3600.0,
    totalFinals: 4350.0,
  },
  {
    rank: 4,
    userId: "user4",
    nickname: "BluffMaster",
    totalNetEarnings: 520.75,
    gamesPlayed: 10,
    winRate: 60.0,
    averageNetPerGame: 52.08,
    totalBuyIns: 2000.0,
    totalFinals: 2520.75,
  },
  {
    rank: 5,
    userId: "user5",
    nickname: "RiverKing",
    totalNetEarnings: 320.5,
    gamesPlayed: 14,
    winRate: 50.0,
    averageNetPerGame: 22.89,
    totalBuyIns: 2800.0,
    totalFinals: 3120.5,
  },
  {
    rank: 6,
    userId: "user6",
    nickname: "AllInAndy",
    totalNetEarnings: 150.25,
    gamesPlayed: 8,
    winRate: 50.0,
    averageNetPerGame: 18.78,
    totalBuyIns: 1600.0,
    totalFinals: 1750.25,
  },
  {
    rank: 7,
    userId: "user7",
    nickname: "FoldFold",
    totalNetEarnings: -85.5,
    gamesPlayed: 11,
    winRate: 36.4,
    averageNetPerGame: -7.77,
    totalBuyIns: 2200.0,
    totalFinals: 2114.5,
  },
  {
    rank: 8,
    userId: "user8",
    nickname: "BustOut",
    totalNetEarnings: -220.75,
    gamesPlayed: 9,
    winRate: 33.3,
    averageNetPerGame: -24.53,
    totalBuyIns: 1800.0,
    totalFinals: 1579.25,
  },
];

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

export default function LeaderboardPage() {
  const session = authClient.useSession();
  const isAuthenticated = !!session.data?.user;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex justify-between items-center p-4">
        <Button variant="ghost" asChild>
          <Link href="/">← Back</Link>
        </Button>
        <AuthButton />
      </div>

      <div className="flex-1 p-4 pb-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="size-8 text-yellow-500" />
              <h1 className="text-3xl font-bold">Leaderboard</h1>
            </div>
            <p className="text-muted-foreground">
              Top performers across all games
            </p>
          </div>

          {!isAuthenticated ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-muted-foreground">
                Sign in to view the leaderboard
              </p>
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button variant="outline" asChild>
                  <Link href="/stats">View My Stats</Link>
                </Button>
              </div>

              <div className="rounded-lg border bg-card">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-right">
                          Net Earnings
                        </TableHead>
                        <TableHead className="text-right hidden sm:table-cell">
                          Games
                        </TableHead>
                        <TableHead className="text-right hidden md:table-cell">
                          Win Rate
                        </TableHead>
                        <TableHead className="text-right hidden lg:table-cell">
                          Avg/Game
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockLeaderboardData.map((entry) => (
                        <TableRow key={entry.userId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {entry.rank <= 3 ? (
                                <Badge
                                  variant={
                                    entry.rank === 1
                                      ? "default"
                                      : entry.rank === 2
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="w-8 h-8 flex items-center justify-center p-0"
                                >
                                  {entry.rank}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground font-medium">
                                  #{entry.rank}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {entry.nickname}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className={`font-semibold ${
                                entry.totalNetEarnings >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {entry.totalNetEarnings >= 0 ? (
                                <TrendingUp className="inline size-4 mr-1" />
                              ) : (
                                <TrendingDown className="inline size-4 mr-1" />
                              )}
                              {formatCurrency(entry.totalNetEarnings)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell">
                            <span className="text-muted-foreground">
                              {entry.gamesPlayed}
                            </span>
                          </TableCell>
                          <TableCell className="text-right hidden md:table-cell">
                            <span className="text-muted-foreground">
                              {formatPercentage(entry.winRate)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right hidden lg:table-cell">
                            <span className="text-muted-foreground">
                              {formatCurrency(entry.averageNetPerGame)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <BarChart3 className="size-4" />
                    <span className="text-sm font-medium">Total Players</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {mockLeaderboardData.length}
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Trophy className="size-4" />
                    <span className="text-sm font-medium">Top Earner</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {mockLeaderboardData[0]?.nickname}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(
                      mockLeaderboardData[0]?.totalNetEarnings || 0
                    )}
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="size-4" />
                    <span className="text-sm font-medium">Avg Win Rate</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatPercentage(
                      mockLeaderboardData.reduce(
                        (sum, entry) => sum + entry.winRate,
                        0
                      ) / mockLeaderboardData.length
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
