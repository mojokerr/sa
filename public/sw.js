const CACHE_NAME = "boostgram-v1"
const STATIC_CACHE = "boostgram-static-v1"
const DYNAMIC_CACHE = "boostgram-dynamic-v1"

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/auth/signin",
  "/auth/signup",
  "/manifest.json",
  "/offline.html",
  // Add your CSS and JS files here
]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...")

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Service Worker: Caching static assets")
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log("Service Worker: Static assets cached")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("Service Worker: Failed to cache static assets", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("Service Worker: Deleting old cache", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("Service Worker: Activated")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Return offline response for API requests
            return new Response(
              JSON.stringify({
                error: "Offline",
                message: "أنت غير متصل بالإنترنت حالياً",
              }),
              {
                status: 503,
                statusText: "Service Unavailable",
                headers: { "Content-Type": "application/json" },
              },
            )
          })
        }),
    )
    return
  }

  // Handle page requests
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful page responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Return cached page if available
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Return offline page
            return caches.match("/offline.html")
          })
        }),
    )
    return
  }

  // Handle static assets (images, CSS, JS, etc.)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Cache the response
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })

          return response
        })
        .catch(() => {
          // Return placeholder for images
          if (request.destination === "image") {
            return new Response(
              '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">صورة غير متاحة</text></svg>',
              { headers: { "Content-Type": "image/svg+xml" } },
            )
          }

          // Return empty response for other assets
          return new Response("", { status: 404 })
        })
    }),
  )
})

// Background sync for form submissions
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync", event.tag)

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync tasks
      handleBackgroundSync(),
    )
  }
})

// Push notifications
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received")

  let notificationData = {}
  
  if (event.data) {
    try {
      notificationData = event.data.json()
    } catch (e) {
      notificationData = { title: event.data.text() }
    }
  }

  const options = {
    body: notificationData.body || "إشعار جديد من BoostGram AI",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: notificationData.id || 1,
      url: notificationData.url || "/dashboard"
    },
    actions: [
      {
        action: "explore",
        title: "عرض",
        icon: "/icon-explore.png",
      },
      {
        action: "close",
        title: "إغلاق",
        icon: "/icon-close.png",
      },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || "BoostGram AI", 
      options
    )
  )
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked", event.action)

  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || "/dashboard")
    )
  } else if (event.action === "close") {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow(event.notification.data.url || "/dashboard")
    )
  }
})

// Message handler for communication with main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker: Message received", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      }),
    )
  }

  // Handle transfer progress updates
  if (event.data && event.data.type === "TRANSFER_PROGRESS") {
    // Broadcast to all clients
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "TRANSFER_PROGRESS_UPDATE",
            data: event.data.progress
          })
        })
      })
    )
  }
})

// Helper function for background sync
async function handleBackgroundSync() {
  try {
    // Get pending transfer operations from IndexedDB or localStorage
    const pendingTransfers = await getPendingTransfers()
    
    for (const transfer of pendingTransfers) {
      try {
        // Retry failed transfers
        await retryTransfer(transfer)
      } catch (error) {
        console.error("Background sync failed for transfer:", transfer.id, error)
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error)
  }
}

async function getPendingTransfers() {
  // This would typically read from IndexedDB
  // For now, return empty array
  return []
}

async function retryTransfer(transfer) {
  // This would retry a failed transfer operation
  console.log("Retrying transfer:", transfer.id)
}

// Transfer monitoring functionality
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "START_TRANSFER_MONITORING") {
    const orderId = event.data.orderId
    
    // Start monitoring transfer progress
    monitorTransferProgress(orderId)
  }
})

async function monitorTransferProgress(orderId) {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const order = await response.json()
        
        // Broadcast progress to all clients
        const clients = await self.clients.matchAll()
        clients.forEach((client) => {
          client.postMessage({
            type: "TRANSFER_PROGRESS_UPDATE",
            orderId,
            progress: {
              current: order.currentCount,
              total: order.targetCount,
              status: order.status
            }
          })
        })
        
        // Stop monitoring if transfer is complete
        if (order.status === "COMPLETED" || order.status === "FAILED" || order.status === "CANCELLED") {
          clearInterval(interval)
        }
      }
    } catch (error) {
      console.error("Failed to monitor transfer progress:", error)
    }
  }, 5000) // Check every 5 seconds
}
