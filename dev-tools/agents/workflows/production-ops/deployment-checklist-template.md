### Deployment Checklist

- **Highlight Error Scan**: Run `npm run observability:scan` to check for unhandled errors.
- **Supabase Healthcheck**: Execute `supabase functions list` and verify all functions are deployed.
- **Vercel Status**: Check `vercel --prod` deployment status and confirm no active incidents.
