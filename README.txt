AYESHA BIRTHDAY SITE v9
=======================

TEST TIMING
-----------
Open:   14:20 IST
Close:  14:30 IST

The values are near the top of index.html:
  const OPEN_HOUR=14;
  const OPEN_MINUTE=20;
  const DESTROY_HOUR=14;
  const DESTROY_MINUTE=30;

PREVIEW
-------
Open preview.html or visit /preview.html after starting the Node server.
Preview skips the timer and access-key gate so you can inspect the final page.

MUSIC
-----
Temporary file included:
  assets/meow-birthday.wav

To replace it, keep the same filename or change MUSIC_URL in index.html.
Browsers may still block audible autoplay until a tap/key press. The page retries after the first interaction.

ACCESS KEY
----------
For the current test the key is:
  Ratul

The key is validated by server.js, not by the HTML, so it is not exposed in page source.
Change it by setting environment variable BIRTHDAY_ACCESS_KEY, for example:
  Windows PowerShell:
    $env:BIRTHDAY_ACCESS_KEY="MyNewKey"
  macOS/Linux:
    export BIRTHDAY_ACCESS_KEY="MyNewKey"

ONE-TIME DEVICE REGISTRATION
----------------------------
A browser generates a local device UUID and sends it to /api/activate.
The first authorized device is registered by default.
A second/new device is rejected unless it is manually activated from the backend.

Admin activation example:
  POST /api/admin/add-device
  JSON: {"adminKey":"<your admin key>","deviceId":"<device-id>"}

Admin list example:
  GET /api/admin/list?key=<your admin key>

Change the admin key with BIRTHDAY_ADMIN_KEY.
Default value is intentionally a placeholder: change it before deployment.

IMPORTANT SECURITY NOTE
-----------------------
This is designed for a personal birthday project, not for high-security identity verification.
The browser's local device id can be cleared by the user. The server is what provides cross-device registration.
For true one-time enforcement, host the site with server.js (or port the same endpoints to your chosen backend).

RUN LOCALLY
-----------
Node.js 18+ is recommended.
No npm package is required.

  cd ayesha-birthday
  node server.js

Then open:
  http://localhost:3000/

For preview:
  http://localhost:3000/preview.html

OWNER / MULTIPLE DEVICES
------------------------
If a second laptop/phone tries the key, the page returns a device code and asks that it be sent to the owner.
On your admin side open:
  /admin.html
Enter your BIRTHDAY_ADMIN_KEY and the device code, then choose Activate device.
After activation, that device can use the birthday page.

The first device is auto-registered after the correct access key is entered. By default, new devices are blocked after that.
To allow automatic registration of every device (not recommended for this one-time design), set ALLOW_NEW_DEVICES=true.
