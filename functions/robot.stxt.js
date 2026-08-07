/**
 * Cloudflare Pages Edge Function Alias for robot.stxt
 */
import { onRequest as handleRobots } from './robots.txt.js'

export async function onRequest(context) {
  return handleRobots(context)
}
