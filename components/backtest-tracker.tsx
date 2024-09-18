"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function BacktestTracker() {
  const [initialBalance, setInitialBalance] = useState(10000)
  const [riskPercentage, setRiskPercentage] = useState(1)
  const [rewardPercentage, setRewardPercentage] = useState(2)
  const [currentBalance, setCurrentBalance] = useState(initialBalance)
  const [wins, setWins] = useState(0)
  const [losses, setLosses] = useState(0)
  const [breakEven, setBreakEven] = useState(0)
  const [balanceHistory, setBalanceHistory] = useState([{ time: 0, balance: initialBalance }])
  const [totalProfit, setTotalProfit] = useState(0)
  const [totalLoss, setTotalLoss] = useState(0)
  const [maxDrawdown, setMaxDrawdown] = useState(0)
  const [sharpeRatio, setSharpeRatio] = useState(0)

  useEffect(() => {
    resetTracker()
  }, [initialBalance, riskPercentage, rewardPercentage])

  const handleWin = () => {
    const profit = (currentBalance * rewardPercentage) / 100
    setCurrentBalance(prev => prev + profit)
    setWins(prev => prev + 1)
    setTotalProfit(prev => prev + profit)
    updateBalanceHistory(currentBalance + profit)
  }

  const handleLoss = () => {
    const loss = (currentBalance * riskPercentage) / 100
    setCurrentBalance(prev => prev - loss)
    setLosses(prev => prev + 1)
    setTotalLoss(prev => prev + loss)
    updateBalanceHistory(currentBalance - loss)
  }

  const handleBreakEven = () => {
    setBreakEven(prev => prev + 1)
    updateBalanceHistory(currentBalance)
  }

  const resetTracker = () => {
    setCurrentBalance(initialBalance)
    setWins(0)
    setLosses(0)
    setBreakEven(0)
    setTotalProfit(0)
    setTotalLoss(0)
    setBalanceHistory([{ time: 0, balance: initialBalance }])
    setMaxDrawdown(0)
    setSharpeRatio(0)
  }

  const updateBalanceHistory = (newBalance: number) => {
    setBalanceHistory(prev => {
      const newHistory = [...prev, { time: prev.length, balance: newBalance }]
      updateMaxDrawdown(newHistory)
      updateSharpeRatio(newHistory)
      return newHistory
    })
  }

  const updateMaxDrawdown = (history: { time: number, balance: number }[]) => {
    let peak = initialBalance
    let maxDrawdown = 0
    
    history.forEach(({ balance }) => {
      if (balance > peak) {
        peak = balance
      } else {
        const drawdown = (peak - balance) / peak
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown
        }
      }
    })

    setMaxDrawdown(maxDrawdown * 100)
  }

  const updateSharpeRatio = (history: { time: number, balance: number }[]) => {
    if (history.length < 2) return

    const returns = history.slice(1).map((entry, index) => 
      (entry.balance - history[index].balance) / history[index].balance
    )

    const averageReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    const stdDev = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - averageReturn, 2), 0) / returns.length)

    const annualizedReturn = averageReturn * 252 // Assuming 252 trading days in a year
    const annualizedStdDev = stdDev * Math.sqrt(252)

    const sharpeRatio = annualizedStdDev !== 0 ? annualizedReturn / annualizedStdDev : 0
    setSharpeRatio(sharpeRatio)
  }

  const calculateMetrics = () => {
    const totalTrades = wins + losses + breakEven
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0
    const lossRate = totalTrades > 0 ? (losses / totalTrades) * 100 : 0
    const breakEvenRate = totalTrades > 0 ? (breakEven / totalTrades) * 100 : 0
    const averageWin = wins > 0 ? totalProfit / wins : 0
    const averageLoss = losses > 0 ? totalLoss / losses : 0
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0
    const expectedValue = (winRate / 100 * averageWin) - (lossRate / 100 * averageLoss)

    return {
      winRate: winRate.toFixed(2),
      lossRate: lossRate.toFixed(2),
      breakEvenRate: breakEvenRate.toFixed(2),
      netProfit: (totalProfit - totalLoss).toFixed(2),
      averageWin: averageWin.toFixed(2),
      averageLoss: averageLoss.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      expectedValue: expectedValue.toFixed(2),
    }
  }

  const metrics = calculateMetrics()

  const formatTooltip = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8">
      <Card className="w-full max-w-4xl mx-auto bg-gray-800 text-white">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">Backtest Tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="initial-balance" className="text-sm">Initial Balance ($)</Label>
              <Input
                id="initial-balance"
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(Number(e.target.value))}
                className="bg-gray-700 text-white border-gray-600 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="risk-percentage" className="text-sm">Risk (%)</Label>
              <Input
                id="risk-percentage"
                type="number"
                value={riskPercentage}
                onChange={(e) => setRiskPercentage(Number(e.target.value))}
                className="bg-gray-700 text-white border-gray-600 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="reward-percentage" className="text-sm">Reward (%)</Label>
              <Input
                id="reward-percentage"
                type="number"
                value={rewardPercentage}
                onChange={(e) => setRewardPercentage(Number(e.target.value))}
                className="bg-gray-700 text-white border-gray-600 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="rr-ratio" className="text-sm">R:R Ratio</Label>
              <Input
                id="rr-ratio"
                type="number"
                value={(rewardPercentage / riskPercentage).toFixed(2)}
                readOnly
                className="bg-gray-700 text-white border-gray-600 mt-1"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={handleWin} className="bg-green-500 hover:bg-green-600 px-6 py-2">Win</Button>
            <Button onClick={handleLoss} className="bg-red-500 hover:bg-red-600 px-6 py-2">Loss</Button>
            <Button onClick={handleBreakEven} className="bg-yellow-500 hover:bg-yellow-600 px-6 py-2">Break Even</Button>
            <Button onClick={resetTracker} className="bg-blue-500 hover:bg-blue-600 px-6 py-2">Reset</Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-700 p-3 sm:p-4 rounded-lg">
              <p className="text-base sm:text-lg font-semibold">Current Balance</p>
              <p className="text-xl sm:text-2xl font-bold">${currentBalance.toFixed(2)}</p>
            </div>
            <div className="bg-green-600 p-3 sm:p-4 rounded-lg">
              <p className="text-base sm:text-lg font-semibold">Wins</p>
              <p className="text-xl sm:text-2xl font-bold">{wins}</p>
            </div>
            <div className="bg-red-600 p-3 sm:p-4 rounded-lg">
              <p className="text-base sm:text-lg font-semibold">Losses</p>
              <p className="text-xl sm:text-2xl font-bold">{losses}</p>
            </div>
            <div className="bg-yellow-600 p-3 sm:p-4 rounded-lg">
              <p className="text-base sm:text-lg font-semibold">Break Even</p>
              <p className="text-xl sm:text-2xl font-bold">{breakEven}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-center">
            {[
              { label: "Win Rate", value: `${metrics.winRate}%` },
              { label: "Loss Rate", value: `${metrics.lossRate}%` },
              { label: "Break Even Rate", value: `${metrics.breakEvenRate}%` },
              { label: "Net Profit", value: `$${metrics.netProfit}` },
              { label: "Avg Win", value: `$${metrics.averageWin}` },
              { label: "Avg Loss", value: `$${metrics.averageLoss}` },
              { label: "Profit Factor", value: metrics.profitFactor },
              { label: "Expected Value", value: `$${metrics.expectedValue}` },
              { label: "Total Profit", value: `$${totalProfit.toFixed(2)}` },
              { label: "Total Loss", value: `$${totalLoss.toFixed(2)}` },
              { label: "Max Drawdown", value: `${maxDrawdown.toFixed(2)}%` },
              { label: "Sharpe Ratio", value: sharpeRatio.toFixed(2) }
            ].map((item, index) => (
              <div key={index} className="bg-gray-700 p-2 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-semibold">{item.label}</p>
                <p className="text-sm sm:text-lg font-bold">{item.value}</p>
              </div>
            ))}
          </div>
          
          <div className="h-48 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceHistory}>
                <XAxis dataKey="time" />
                <YAxis width={50} />
                <Tooltip formatter={formatTooltip} />
                <Line type="monotone" dataKey="balance" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}