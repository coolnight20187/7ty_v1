:: FILE: deploy.bat
:: MỤC TIÊU: Tự động hóa 3 lệnh git để đẩy code lên GitHub.
:: CÁCH CHẠY: Mở Terminal trong VS Code và gõ: .\deploy.bat

@echo off
echo [Buoc 1/3] Dang them tat ca cac file...
git add .

:: Lấy ngày giờ hiện tại để tạo commit message tự động
:: Định dạng: YYYY-MM-DD @ HH:mm
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "Min=%dt:~10,2%"
set "FullDate=%YYYY%-%MM%-%DD% @ %HH%:%Min%"

echo [Buoc 2/3] Dang commit file voi ten: "Cap nhat ngay %FullDate%"
git commit -m "Cap nhat ngay %FullDate%"

echo [Buoc 3/3] Dang day file len GitHub (origin main)...
git push origin main

echo.
echo HOAN THANH! Da day code len GitHub.
echo Ban co the kiem tra Netlify de xem qua trinh deploy moi.
pause
