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

## Prototype architecture
- Use shared communication choices and an AI Elements-based Toms chat surface for public VID and EDS so the same workflows remain consistent.
- Keep identification, chat replies and submissions explicitly simulated in this frontend prototype; no live VID connection exists.
- Match the user's screenshots using semantic VID, EDS and chat color roles in the global stylesheet, not new independent themes.
- Scope mailbox-shell tokens and layout overrides to EDS so screenshot fidelity changes do not alter the shared public VID interface.
- Keep EDS simulated replies intent-driven using the latest question and accumulated context for specialist summaries; illustrative escalation scenarios are not production classification rules.
- Keep public communication options behind the publicSite variant; use section visibility to move the shared public chat between its corner and inline positions without resetting the conversation or altering EDS.
- Keep the public-to-EDS handoff simulated in session storage, with a visible prototype sign-in step before restoring the same conversation.
- General tax/customs questions use a server function calling the AI gateway with web search; personal-data, complex and sign-in scenarios stay scripted so the prototype never invents personal data.
