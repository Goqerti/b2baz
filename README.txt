B2B Hotel Booking System (Tam Hazır Tətbiq)
==========================================

Fayllar:
- index.html   → B2B booking / kalkulyator (agent tərəfi)
- admin.html   → Admin panel (region, hotel, otaq tipi, meal plan, operations)
- server.js    → Node.js + Express server (db.json faylı ilə)
- db.json      → JSON database (ilk dəfə server işləyəndə avtomatik yaranır)
- package.json → Node layihə faylı

İşə salmaq:
1. Kompüterində Node.js quraşdır (əgər yoxdursa).
2. Bu layihəni bir qovluğa çıxart.
3. Terminal / CMD aç və həmin qovluğa keç:
   cd b2b-hotel-app-final
4. Lazım olan paketləri quraşdır:
   npm install
5. Serveri işə sal:
   npm start
6. Brauzerdə aç:
   http://localhost:3000/index.html   → Booking / Kalkulyator
   http://localhost:3000/admin.html   → Admin panel

Admin panel:
- Region əlavə edə bilərsən.
- Operation / Service əlavə edə bilərsən (transfer, tour və s.).
- Hotel əlavə edəndə:
  * Region seçirsən
  * Ulduz sayını seçirsən
  * Extra bed qiyməti (gecəlik) yazırsan
  * Bir neçə room type (ad + gecəlik qiymət) əlavə edirsən
  * Bir neçə meal plan (BB, HB, AI və s.) + qiymət əlavə edirsən

Booking (index.html):
- Check-in / check-out seçəndə gecə sayı avtomatik hesablanır.
- Region seçiləndən sonra həmin regionun hotelləri gəlir.
- Hotel seçiləndə:
  * Otaq tipləri select-lərdə çıxır
  * “+ Room type əlavə et” ilə birdən çox otaq tipi əlavə etmək olur
  * Hər room üçün + / - ilə otaq sayını artıra/azalda bilirsən
  * Extra bed checkbox ilə uşaqlar üçün əlavə çarpayı qiyməti hesablanır
  * Meal plan radio ilə seçilir (BB / HB / AI və s.)
- Operations (transfer / tour və s.) checkbox-larla seçilir və total-a əlavə olunur.
- Solda: rooms subtotal, extra beds, meals, hotel subtotal, tax (5%).
- Sağda: operations cəmi və Grand Total.

Bütün qiymətlər və hotel, otaq tipi, meal plan, operations admin paneldən girilir və db.json-da saxlanılır.
