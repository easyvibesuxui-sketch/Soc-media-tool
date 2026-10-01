import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// Minimal config: no incremental cache configured, because this app has no
// ISR pages that need one. `/api/generate-blog` caches in-process per isolate,
// and everything else is either static or fully dynamic.
export default defineCloudflareConfig()
