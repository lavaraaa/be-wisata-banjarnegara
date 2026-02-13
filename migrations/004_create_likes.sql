SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS likes;

create table likes
(
    id         int auto_increment
        primary key,
    user_id    int                                 not null,
    wisata_id  int                                 not null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    constraint unique_like
        unique (user_id, wisata_id),
    constraint fk_likes_user
        foreign key (user_id) references users (id)
            on delete cascade,
    constraint fk_likes_wisata
        foreign key (wisata_id) references wisata (id)
            on delete cascade
)
    collate = utf8mb4_unicode_ci;

INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (8, 5, 22, '2026-01-04 12:56:08');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (20, 10, 17, '2026-01-05 06:08:49');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (24, 10, 22, '2026-01-05 06:09:56');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (25, 10, 21, '2026-01-05 06:10:22');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (26, 10, 23, '2026-01-05 06:10:44');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (27, 10, 20, '2026-01-05 06:11:12');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (57, 15, 17, '2026-01-05 14:24:00');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (84, 15, 19, '2026-01-05 14:24:57');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (86, 13, 16, '2026-01-06 04:36:58');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (87, 13, 17, '2026-01-06 04:37:14');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (88, 13, 15, '2026-01-06 04:38:39');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (90, 17, 22, '2026-01-06 09:39:45');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (91, 17, 17, '2026-01-06 09:41:53');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (92, 17, 16, '2026-01-06 09:44:43');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (93, 18, 19, '2026-01-06 12:17:25');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (96, 18, 21, '2026-01-06 12:18:52');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (98, 19, 19, '2026-01-06 16:37:10');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (128, 21, 17, '2026-01-08 04:27:31');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (141, 21, 15, '2026-01-08 04:27:43');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (159, 21, 23, '2026-01-08 04:28:11');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (162, 24, 17, '2026-01-08 08:32:36');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (163, 24, 16, '2026-01-08 08:32:52');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (174, 15, 20, '2026-01-08 09:33:11');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (191, 15, 16, '2026-01-08 09:39:41');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (192, 25, 17, '2026-01-08 11:46:55');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (193, 29, 19, '2026-01-08 13:38:58');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (194, 31, 23, '2026-01-08 15:10:36');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (195, 31, 20, '2026-01-08 15:10:53');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (196, 35, 16, '2026-01-09 02:43:00');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (198, 36, 17, '2026-01-09 03:53:24');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (200, 38, 16, '2026-01-09 10:15:40');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (201, 38, 23, '2026-01-09 10:16:23');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (202, 41, 16, '2026-01-09 10:29:01');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (204, 1, 19, '2026-01-10 05:25:56');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (205, 1, 17, '2026-01-10 05:26:05');
INSERT INTO likes (id, user_id, wisata_id, created_at) VALUES (206, 1, 16, '2026-01-10 05:26:17');

SET FOREIGN_KEY_CHECKS=1;
