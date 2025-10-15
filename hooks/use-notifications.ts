import { useState, useEffect, useCallback } from "react"
import { getNotifications, saveNotification, markNotificationAsRead } from "@/lib/storage"
import type { Notification } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const loadNotifications = useCallback(() => {
    const loaded = getNotifications()
    setNotifications(loaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const initializeNotifications = () => {
    // Lógica para inicializar notificações, se necessário
    // Por exemplo, verificar se há notificações de recorrência pendentes
    loadNotifications()
  }

  const addNotification = (message: string) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      message,
      timestamp: new Date().toISOString(),
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveNotification(newNotification)
    loadNotifications()
    toast({
      title: "Nova Notificação",
      description: message,
    })
  }

  const markAsRead = (id: string) => {
    markNotificationAsRead(id)
    loadNotifications()
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    initializeNotifications,
    loadNotifications,
  }
}