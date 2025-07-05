# LinkedIn Easy Apply Bot

## What it does
- Searches LinkedIn for jobs matching your `JOB_KEYWORD`
- Filters for “Easy Apply”
- Applies automatically with your resume
- Triggered via Telegram command `/apply`

## Setup

1. Clone this repo to Render (Docker).
2. Add your environment variables in Render’s dashboard (Settings → Environment):
   - `LI_AT` ← your LinkedIn session cookie
   - `TG_BOT_TOKEN` ← your Telegram Bot token
   - `JOB_KEYWORD` ← e.g. `Project Manager`
   - `JOB_LOCATION` ← leave blank for worldwide
   - `RESUME_PATH` ← `/app/resume/Mohd_Fakhri_Resume_PM.pdf`
3. Upload your resume PDF into the `resume/` folder.
4. Deploy on Render as a Docker Web Service.
5. Send `/apply` in your Telegram bot chat to run.

## Notes
- Bot applies to up to 10 most recent Easy Apply postings each run.
- Adjust `slice(0, 10)` in **index.js** to change that limit.
