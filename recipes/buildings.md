# Bina tarifi

Oku: GUIDE.md → bu tarif → src/motifs/architecture.ts.
Örnek: demo/recipes.ts. Tuval 80×96; önce binanın 40×55 ana gövdesini kur.

1. Dış siluet: basit dikdörtgen gövde, üstte birkaç mazgal.
2. Işık sol üstte: sol kenar açık, ön yüz orta, sağ yan koyu.
3. stoneCourses ile büyük taş sıraları; kontrastı siluetten düşük tut.
4. archedDoor ile karanlık iç boşluk, ahşap kanat ve açık kemer.
5. lancetWindow ile bir dar pencere; parlak renk küçük alan kaplasın.
6. Ayrı tuvalde outline, sonra temas gölgesinin üstüne blit.

Seviye kararını çağıran verir: başlangıç gövde+kapı+bir pencere; sonra
kapı demiri, yan mazgal, bayrak, yan kule. Her seviyede bütün sprite'ı
farklı stile geçirme. Bu sıralama bir örnektir, motorun oyun kuralı değildir.

Kontrol: kapı duvara yapışmış çizgi mi yoksa içeri gömülü mü?
Mazgal açık renk kare gibi mi yoksa derin açıklık mı?
Taş derzleri ana siluetten daha mı baskın? Öyleyse kontrastı azalt.
