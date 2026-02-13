SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS users;

create table users
(
    id         int auto_increment
        primary key,
    username   varchar(255)                                     null,
    email      varchar(100)                                     not null,
    password   varchar(255)                                     not null,
    role       enum ('user', 'admin') default 'user'            null,
    created_at timestamp              default CURRENT_TIMESTAMP not null,
    photoURL   varchar(255)                                     null,
    constraint email
        unique (email)
)
    collate = utf8mb4_unicode_ci;

INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (1, 'ell', 'ell@gmail.com', '$2b$10$RMpxHdyrvyYRUgW6zNUxOeNJ6sbOz5EbmjaJ06LnB/1Ijgm0ZwuoS', 'user', '2025-12-06 14:20:28', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (4, 'admin', 'admin1234@gmail.com', '$2b$10$Rh/Kp.0WB.g6vkrmggXd/.naDdZUBsF0J4EvlktM8AdG6Ud9uyfK2', 'admin', '2025-12-11 02:58:47', 'https://ksjglnabyjehcodgvssp.supabase.co/storage/v1/object/public/images/fotoprofil/1767773641348_logo.png');
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (5, 'KangTip', 'bujangginda@gmail.com', '$2b$10$i45dKRSXalPCU0jmKdalq.Ox7MxBA66yxsRfDZF9OL6MjeLCBJQg6', 'user', '2026-01-04 12:53:58', 'https://ksjglnabyjehcodgvssp.supabase.co/storage/v1/object/public/images/fotoprofil/1767531466448_Screenshot_20260104-195631.jpg');
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (6, 'nia', 'nikmahkurniamufadilahh@gmail.com', '$2b$10$aTFDVXuVMwbtMe41uKMQhu8tY/qqnOsZqHBWLII9sEkeU7t3Ro3tW', 'user', '2026-01-05 04:25:53', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (10, 'sapimakanroti', 'sapimakanroti@gmail.com', '$2b$10$OLgI0ZPXsNuukiTkdHN7feUkUEL4heosjmwNRQR4SFpoa0d0maiRC', 'user', '2026-01-05 05:58:56', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (13, 'Delia', 'deliapurnamapu3@gmail.com', '$2b$10$cnau1QgFqq2yVgEzfyUe5.MPPaaWDRdOhvkJWddizvo/mvRKYJL16', 'user', '2026-01-05 10:31:07', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (14, 'Relung', 'gaslandirelung@gmail.com', '$2b$10$EWsiFSSIlGaOYyTt3f5/0eu.kK909BbfFl70XMpiefKhEWEsk09iO', 'user', '2026-01-05 11:53:04', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (15, 'Sandy', 'arsandy@mail.com', '$2b$10$5wh.TjcgEH5JkSZ3KJpQLeEDcSeEMCPF9kSBk0qydTsVaOTVkoJ1W', 'user', '2026-01-05 14:19:31', 'https://ksjglnabyjehcodgvssp.supabase.co/storage/v1/object/public/images/fotoprofil/1767622819163_After%20filming%20seasons%202%20and%203%20of%20Breaking%20Bad,%20Bryan%20Cranston%20and%20Aaron%20Paul%20switched%20things%20up%20%20(1).jpg');
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (16, 'bennyprayogo', 'bnnpryg@gmail.com', '$2b$10$1G5q/hm46hwac2/f9aEJheTak2DSEC4h09KwwjuBXatjrBXtNn9yi', 'user', '2026-01-06 04:51:33', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (17, 'harundarat', 'harundarat@gmail.com', '$2b$10$8O3eA5PXCVSZB7WXoH3rBufAUgIVOCuJt/DRy/l8f5I6pa59APYQ6', 'user', '2026-01-06 09:37:05', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (18, 'inna', 'nurulmtmainnahs03@gmail.com', '$2b$10$7dbRWzjs9NresD8XkNfMYu4MV0gH8pwn99qLxiS2/SitO9l9gNBrq', 'user', '2026-01-06 12:11:29', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (19, 'rivaldojeff', 'rivaldojeffmarvin0@gmail.com', '$2b$10$EfcLvwLuGhGYRWWWH4qrreVxzsha4t7HA6Qhzqtuog8b1PQiQqzvm', 'user', '2026-01-06 16:26:51', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (20, '4BV396J3B4', 'muftihanif23@gmail.com', '$2b$10$7FudCvunPZyr09vsCzJJcu.LlWwV6UWG560CbaxMyhb/Jy4yeP5mq', 'user', '2026-01-08 01:50:33', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (21, 'Latif Anake Slamet', 'wakwaw@gmail.com', '$2b$10$5dR2XL9iHkDUWlqHhcy09eW3EbAVgIJTdbJE4rY3jIXhzZmGLO72q', 'user', '2026-01-08 04:26:40', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (22, 'Putra', 'gesangmy09@gmail.com', '$2b$10$OmFiKSbeuJFwKk0YqO8fH.zc3Viis3iv6X3bZSfB/zYSn7HUYLrxe', 'user', '2026-01-08 04:51:11', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (24, 'andin', 'andini.doc@gmail.com', '$2b$10$PoN5Jxvrev6F8B9raIYsLeD2m7AgmmG/hCmGCCvC0x0FiarnIG/j6', 'user', '2026-01-08 08:31:47', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (25, 'Hen', 'putrahendra772@gmail.com', '$2b$10$pCHuS.ii1RBzFLxtULVU5uDZWGVsP5mJeWGbxyRO2pDLt6MM0PQ2O', 'user', '2026-01-08 11:44:06', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (26, 'nicholas', 'wijayaottonicholas@gmail.com', '$2b$10$a/u5q72oLO0h/yF.VAs7Nu4Fk1pl1tGnr2JJkNExypOE.mTyFbu32', 'user', '2026-01-08 12:28:15', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (27, 'joms', 'faiznur011@gmail.com', '$2b$10$kLFNMS/kDWVQUa3fLUEpxOtCzBkvOsV/W6ja8WNRKDoZtOow4YQVi', 'user', '2026-01-08 13:27:29', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (28, 'joms123', 'joms123@gmail.com', '$2b$10$dCOrqbEdKgNb6anRzHRHZu4z1CXIPF3IVFNDG8LDFkc7dtOoiDnaK', 'user', '2026-01-08 13:29:37', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (29, 'Nurmabs', 'titoditya456@gmail.com', '$2b$10$eExklFmsqwQa46N8rA09GOWwV75w/R2Ve5dfswsFdzFFO26so3Fea', 'user', '2026-01-08 13:36:38', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (30, 'fakhriz_zmn', 'fakhrizzaman22@gmail.com', '$2b$10$239vV.qokn0goiQKv6g4Ve5qSdCs70gurgD8eBOobAMSKn/cf3Esu', 'user', '2026-01-08 13:50:35', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (31, 'Lisa', 'lisaa890@gmail.com', '$2b$10$9fJTxYfid0MIWtuVxQ.Q/uQQzOzrAiwdQGwEpm7hiAv.TbTolXk6G', 'user', '2026-01-08 15:08:47', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (32, 'Semar gareng', 'baeyusuf094@gmail.com', '$2b$10$540k9RN.S7hmkassutUNzuxGwClsyfvoYYcTNbl0YeJpzdXPyJEvC', 'user', '2026-01-09 00:05:01', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (33, 'monyu', 'danielvascozack@gmail.com', '$2b$10$Kuxg4hXzRdO10Vm.8vQ80O.iu4Pt8b8jonFwT74RFIZMxRpABkmvG', 'user', '2026-01-09 01:48:12', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (34, 'Asyifa Febriana', 'asyifa13februari@gmail.com', '$2b$10$qPZOYw4z1RG8eu6naDJMjue8SohUVOeHeuEwPiPpHVrhnLRwEU2cC', 'user', '2026-01-09 02:36:05', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (35, 'Izah', 'nabeela0527@gmail.com', '$2b$10$WS0LQkNZHoYaT6CWorDLje8v6a7g62raFYFr/2PtuiA.6IFbfGDgW', 'user', '2026-01-09 02:41:50', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (36, 'Feni Rahmawati', 'fenirahmawati43@gmail.com', '$2b$10$Ooe0ck5p/4eHFkibBn.sD.WuxuTVOizT.a8vbDhYGps.uyl8aZwRi', 'user', '2026-01-09 03:52:17', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (38, 'bintari', 'bintariwidiandiniwantoro@gmail.com', '$2b$10$BnzPoArAgqxPSRpEJ4wpgucbKJjINnv3hc2a4o7QWE5bx46Nt1Zc6', 'user', '2026-01-09 10:14:47', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (39, 'Nur syarifah', 'Syarifahnur@gmail.com', '$2b$10$LL3odR0xzXJ699yE1VJVxOEI615iARWXpjtFVirNWwWJ2ZclY17ji', 'user', '2026-01-09 10:22:19', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (41, 'ellendela', 'halohayhalo@gmail.com', '$2b$10$JmPpVKC2McOqxMRxzWKKJOnNdK5NKR8O.WQcg8eGvAYIMVtonSOrS', 'user', '2026-01-09 10:24:47', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (42, 'Firdausy', 'nauranufaisa@gmail.com', '$2b$10$eXRthERXQAAU1CMUJlOe3Og.m1bC7VFjQXD4qO.rkfzx/iz6ioJ0y', 'user', '2026-01-09 10:25:04', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (43, 'rahman', 'rahman@gmail.com', '$2b$10$3mdmCohth9Nc9VFOVuYvw.8dtAJrHI2/BMhEmtk0n392Xs.LxlnSy', 'user', '2026-01-10 12:35:32', null);
INSERT INTO users (id, username, email, password, role, created_at, photoURL) VALUES (44, 'lutfan', 'lutfan@gmail.com', '$2b$10$xkk3SH90AVxCUu3l9NwO8.ume.sTThdmtaS4M89kv5hj.xUipSO2a', 'user', '2026-02-12 01:01:30', null);

SET FOREIGN_KEY_CHECKS=1;
