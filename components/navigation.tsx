"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Users, FileText, Calendar, Receipt, Menu, X, BarChart3, Bell, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { getObligationsWithDetails, getTaxesDueDates, getInstallmentsWithDetails } from "@/lib/dashboard-utils"
import { isOverdue } from "@/lib/date-utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { Notification } from "@/lib/types"
import { getNotifications, markNotificationAsRead } from "@/lib/storage"

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [alertCounts, setAlertCounts] = useState({
    overdueObligations: 0,
    pendingObligations: 0,
    upcomingThisWeek: 0,
    overdueInstallments: 0,
    pendingInstallments: 0,
    overdueTaxes: 0,
    pendingTaxes: 0,
  })
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const loadNotifications = () => {
    setNotifications(getNotifications().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  useEffect(() => {
    const obligations = getObligationsWithDetails()
    const installments = getInstallmentsWithDetails()
    const taxesDueDates = getTaxesDueDates(1); // Check current month for overdue/pending

    const overdueObligations = obligations.filter((o) => isOverdue(o.calculatedDueDate) && o.status !== "completed").length
    const pendingObligations = obligations.filter((o) => o.status === "pending").length

    const overdueInstallments = installments.filter((i) => isOverdue(i.calculatedDueDate) && i.status !== "paid").length
    const pendingInstallments = installments.filter((i) => i.status === "pending").length

    const overdueTaxes = taxesDueDates.filter((t) => isOverdue(t.calculatedDueDate) && t.status !== "completed").length;
    const pendingTaxes = taxesDueDates.filter((t) => t.status === "pending").length;


    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcomingObligations = obligations.filter((o) => {
      const dueDate = new Date(o.calculatedDueDate)
      return dueDate >= today && dueDate <= nextWeek && o.status !== "completed"
    }).length
    const upcomingInstallments = installments.filter((i) => {
      const dueDate = new Date(i.calculatedDueDate)
      return dueDate >= today && dueDate <= nextWeek && i.status !== "paid"
    }).length
    const upcomingTaxes = taxesDueDates.filter((t) => {
      const dueDate = new Date(t.calculatedDueDate)
      return dueDate >= today && dueDate <= nextWeek && t.status !== "overdue" // Taxes don't have 'completed' status
    }).length

    setAlertCounts({
      overdueObligations,
      pendingObligations,
      upcomingThisWeek: upcomingObligations + upcomingInstallments + upcomingTaxes,
      overdueInstallments,
      pendingInstallments,
      overdueTaxes,
      pendingTaxes,
    })
    loadNotifications();
  }, [pathname])

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    loadNotifications();
  };

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: alertCounts.overdueObligations + alertCounts.overdueInstallments + alertCounts.overdueTaxes > 0 ? alertCounts.overdueObligations + alertCounts.overdueInstallments + alertCounts.overdueTaxes : null,
      badgeVariant: "destructive" as const,
    },
    { href: "/clientes", label: "Clientes", icon: Users },
    {
      href: "/impostos",
      label: "Impostos",
      icon: Receipt,
      badge: alertCounts.pendingTaxes > 0 ? alertCounts.pendingTaxes : null,
      badgeVariant: "secondary" as const,
    },
    {
      href: "/obrigacoes",
      label: "Obrigações",
      icon: FileText,
      badge: alertCounts.pendingObligations > 0 ? alertCounts.pendingObligations : null,
      badgeVariant: "secondary" as const,
    },
    {
      href: "/parcelamentos",
      label: "Parcelamentos",
      icon: DollarSign,
      badge: alertCounts.pendingInstallments > 0 ? alertCounts.pendingInstallments : null,
      badgeVariant: "secondary" as const,
    },
    {
      href: "/calendario",
      label: "Calendário",
      icon: Calendar,
      badge: alertCounts.upcomingThisWeek > 0 ? alertCounts.upcomingThisWeek : null,
      badgeVariant: "default" as const,
    },
    { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  ]

  const totalAlerts = alertCounts.overdueObligations + alertCounts.overdueInstallments + alertCounts.overdueTaxes + alertCounts.upcomingThisWeek

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                <FileText className="size-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg hidden sm:inline">Controle Fiscal</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn("gap-2 relative transition-all", isActive && "bg-secondary shadow-sm")}
                    >
                      <Icon className="size-4" />
                      {item.label}
                      {item.badge && (
                        <Badge variant={item.badgeVariant} className="ml-1 h-5 min-w-5 px-1 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="size-5" />
                  {unreadNotificationsCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs">
                      {unreadNotificationsCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <div className="flex items-center justify-between p-3">
                  <h4 className="font-semibold text-sm">Notificações</h4>
                  {unreadNotificationsCount > 0 && (
                    <Button variant="link" size="sm" onClick={() => notifications.filter(n => !n.read).forEach(n => handleMarkAsRead(n.id))}>
                      Marcar todas como lidas
                    </Button>
                  )}
                </div>
                <Separator />
                <ScrollArea className="h-60">
                  <div className="p-3 space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-4">Nenhuma notificação</p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer",
                            !notification.read && "bg-blue-50/50 dark:bg-blue-950/20"
                          )}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <div className="flex-1">
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(notification.timestamp).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          {!notification.read && (
                            <span className="size-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden relative"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              {totalAlerts > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs">
                  {totalAlerts}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-1 animate-in slide-in-from-top-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <Icon className="size-4" />
                    {item.label}
                    {item.badge && (
                      <Badge variant={item.badgeVariant} className="ml-auto h-5 min-w-5 px-1 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}