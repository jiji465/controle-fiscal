"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Users, FileText, Calendar, Receipt, Menu, X, BarChart3, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { getObligationsWithDetails } from "@/lib/dashboard-utils"
import { isOverdue } from "@/lib/date-utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover" // Import Popover components
import { ScrollArea } from "@/components/ui/scroll-area" // Import ScrollArea
import { Separator } from "@/components/ui/separator"
import type { Notification } from "@/lib/types"
import { getNotifications, markNotificationAsRead } from "@/lib/storage" // Assuming these functions exist

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [alertCounts, setAlertCounts] = useState({
    overdue: 0,
    pending: 0,
    thisWeek: 0,
  })
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const loadNotifications = () => {
    setNotifications(getNotifications().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  useEffect(() => {
    const obligations = getObligationsWithDetails()
    const overdue = obligations.filter((o) => isOverdue(o.calculatedDueDate) && o.status !== "completed").length
    const pending = obligations.filter((o) => o.status === "pending").length

    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const thisWeek = obligations.filter((o) => {
      const dueDate = new Date(o.calculatedDueDate)
      return dueDate >= today && dueDate <= nextWeek && o.status !== "completed"
    }).length

    setAlertCounts({ overdue, pending, thisWeek })
    loadNotifications(); // Load notifications on data update
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
      badge: alertCounts.overdue > 0 ? alertCounts.overdue : null,
      badgeVariant: "destructive" as const,
    },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/impostos", label: "Impostos", icon: Receipt },
    {
      href: "/obrigacoes",
      label: "Obrigações",
      icon: FileText,
      badge: alertCounts.pending > 0 ? alertCounts.pending : null,
      badgeVariant: "secondary" as const,
    },
    {
      href: "/calendario",
      label: "Calendário",
      icon: Calendar,
      badge: alertCounts.thisWeek > 0 ? alertCounts.thisWeek : null,
      badgeVariant: "default" as const,
    },
    { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  ]

  const totalAlerts = alertCounts.overdue + alertCounts.thisWeek

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