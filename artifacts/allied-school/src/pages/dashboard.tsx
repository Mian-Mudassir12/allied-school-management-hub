import { useQuery } from "@tanstack/react-query";
import { useGetDashboardStats, useGetDailyCollection, useGetClassSummary, getGetDashboardStatsQueryKey, getGetDailyCollectionQueryKey, getGetClassSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Banknote, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() }
  });
  const { data: collection, isLoading: collectionLoading } = useGetDailyCollection(undefined, {
    query: { queryKey: getGetDailyCollectionQueryKey() }
  });
  const { data: classSummary, isLoading: classSummaryLoading } = useGetClassSummary({
    query: { queryKey: getGetClassSummaryQueryKey() }
  });

  const isLoading = statsLoading || collectionLoading || classSummaryLoading;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of Rehman Campus operations today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
              Active Students
              <Users className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">{stats?.activeStudents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of {stats?.totalStudents || 0} enrolled</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
              Fees Collected
              <Banknote className="w-4 h-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">Rs. {(stats?.currentMonthFeeCollected || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 text-red-600">
              Rs. {(stats?.currentMonthFeePending || 0).toLocaleString()} pending
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
              Today's Collection
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">Rs. {(collection?.totalCollected || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {collection?.paymentCount || 0} transactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Class Wise Collection Status</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {classSummary && classSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classSummary} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="class" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `Rs.${val/1000}k`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value: number) => `Rs. ${value.toLocaleString()}`}
                    cursor={{fill: 'rgba(0,0,0,0.05)'}} 
                  />
                  <Bar dataKey="totalFeeCollected" name="Collected" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalFeeExpected" name="Expected" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                No class data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Recent Payments Today</CardTitle>
          </CardHeader>
          <CardContent>
            {collection?.payments && collection.payments.length > 0 ? (
              <div className="space-y-4">
                {collection.payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{payment.studentName}</p>
                      <p className="text-xs text-muted-foreground">{payment.class} - Roll: {payment.rollNumber}</p>
                    </div>
                    <div className="font-mono text-sm font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">
                      + Rs. {payment.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                No payments recorded today
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
