<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use `src/lib/duracao.ts` as the shared source of truth for minute-accurate booking availability and turn fitting; booking and rescheduling must apply the same rules.
- Use a shared browser-side booking-alert hook in both administrative views; frequent polling preserves server-side access scoping, while audio automatically unlocks on the first permitted browser gesture.
- Keep browser notification permission and new-booking detection in the shared alert hook; this keeps both panels scoped to their existing authorized agenda feeds and avoids duplicate initial alerts.
