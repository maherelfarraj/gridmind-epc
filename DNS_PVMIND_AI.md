# DNS cutover — pvmind.ai → Vercel

## Current status

`pvmind.ai` is still on **GoDaddy Website Builder** until DNS is updated at GoDaddy.

Verify anytime:

```bash
./scripts/check-dns-cutover.sh pvmind.ai
```

## GoDaddy steps (manual — requires your login)

1. Sign in at https://dcc.godaddy.com/
2. Open **My Products** → **pvmind.ai** → **DNS** (or **Manage DNS**)
3. **Remove** existing `@` A records pointing to:
   - `76.223.105.230`
   - `13.248.243.5`
4. **Add** A record:
   - Type: **A**
   - Name: **@**
   - Value: **76.76.21.21**
   - TTL: 600 (or default)
5. **Edit** `www` record:
   - Type: **CNAME**
   - Name: **www**
   - Value: **cname.vercel-dns.com**
6. Save. Propagation usually takes 5–30 minutes (up to 48h globally).

## After cutover

- https://pvmind.ai → GridMind / PV_Mind Cockpit (Vercel)
- https://www.pvmind.ai → same app
- https://gridmindepc.vercel.app → always works (Vercel default URL)

## Vercel side (already done)

Domains `pvmind.ai` and `www.pvmind.ai` are added and verified on the **gridmindepc** Vercel project.
