@echo off
echo Starting System...

cd server
echo Setting up Database...
call node setup_db.js

echo Starting Server...
start "Backend Server" npm start

cd ..
cd client
echo Starting Client...
start "Frontend Client" npm run dev

echo System Started!
pause
