# Camp Registration

## Production

### Configure environments

Copy the env files and set them uo
```bash
cp ./backend/.env.example ./.backend/.env
cp ./frontend/.env.example ./.frontend/.env
```

## Development

Clean
```bash
npm run clean --workspaces
```

Install
```bash
npm install
```

Build 
```bash
npm run build --workspaces
```

Test
```bash
npm run test --workspaces
```

Run
```bash
npm run dev --workspace frontend
```
```bash
npm run dev --workspace backend
```