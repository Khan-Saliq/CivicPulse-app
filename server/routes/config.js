import { Router } from 'express'
import {
  ISSUE_CATEGORIES,
  ISSUE_STATUSES,
  CHAT_SUGGESTIONS,
  CHAT_GREETINGS,
  FIELD_TEAMS,
  HIGH_PRIORITY_THRESHOLD,
} from '../config/constants.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json({
    categories: ISSUE_CATEGORIES,
    statuses: ISSUE_STATUSES,
    chatSuggestions: CHAT_SUGGESTIONS,
    chatGreetings: CHAT_GREETINGS,
    fieldTeams: FIELD_TEAMS,
    highPriorityThreshold: HIGH_PRIORITY_THRESHOLD,
  })
})

export default router
