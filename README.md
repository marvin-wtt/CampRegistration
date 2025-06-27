# Camp Registration

## Production

### Configure environments

Copy the env files and set them uo
```bash
cp ./backend/.env.example ./.backend/.env
cp ./frontend/.env.example ./.frontend/.env
```

## Development

Build 
```bash
npm install
npm run build
```

Test
```bash
npm run test --workspaces
```

Run
```bash
npm run dev --workspace backend

npm run dev --workspace frontend
```