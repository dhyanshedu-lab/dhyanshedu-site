# DhyanshEdu Exam Portal — starter build

This is a separate application intended for `exam.dhyanshedu.com`. It does not replace the existing public `dhyanshedu.com` website.

## Included in this first build
- Responsive DhyanshEdu-branded login page.
- Supabase email/password sign-in.
- Reads the signed-in user's `profiles` row and checks `approval_status`.
- Role-aware welcome heading for admin, teacher and student.
- Initial dashboard counts for teachers, students, exams and attempts.
- No service-role or secret key in browser code.

## 1. Configure Supabase
Open `app.js` and replace:
- `PASTE_YOUR_SUPABASE_PROJECT_URL`
- `PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY`

Use the Project URL and the **publishable** key only. Never use a secret/service_role key in `app.js`.

## 2. Verify your admin profile
In Supabase SQL Editor run:

```sql
select id, email, role, approval_status
from public.profiles
where email = 'dhyanshedu@gmail.com';
```

Expected: `role = admin`, `approval_status = approved`.

If no row appears, verify that the Auth user exists and then run:

```sql
insert into public.profiles (id, full_name, email, role, approval_status)
select id, 'DhyanshEdu Admin', email, 'admin', 'approved'
from auth.users
where email = 'dhyanshedu@gmail.com'
on conflict (id) do update
set role = 'admin', approval_status = 'approved';
```

## 3. Test locally
Because `app.js` uses JavaScript modules, serve this folder through a local web server (not by double-clicking `index.html`). For example, with Python installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## 4. Deploy to GitHub Pages
Upload the contents of this folder to a new folder such as `/exam-portal/` in the `exam-portal-development` branch, or publish this folder as the root of a separate repository. Do not overwrite the existing public site's `index.html` on `main`.

For a separate subdomain, configure GitHub Pages for the portal deployment and add `exam.dhyanshedu.com` as its custom domain. DNS changes should be made only after GitHub Pages provides the exact DNS records for this repository.

## Important production work still required
This is a first frontend/authentication milestone, not a complete exam system. Before real student use:
- Add dedicated teacher/student screens and navigation permissions.
- Add a secure Supabase Edge Function for admin-created teacher accounts (service-role key only in Edge Function secrets).
- Review and harden all RLS policies. The initial schema created earlier is a starting point and is not yet a production security review.
- Add server-side exam start/submission, timer enforcement, scoring, numerical tolerance, descriptive marking, and audit logs.
- Add password reset, account recovery, rate limiting and monitoring.
- Test with separate admin, teacher and student accounts.

Do not add student data or conduct real exams until the production security and exam-submission work is complete.
