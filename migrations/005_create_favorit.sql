SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS favorit;

create table favorit
(
    id         int auto_increment
        primary key,
    user_id    int                                 not null,
    wisata_id  int                                 not null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    constraint unique_fav
        unique (user_id, wisata_id),
    constraint fk_favorit_user
        foreign key (user_id) references users (id)
            on delete cascade,
    constraint fk_favorit_wisata
        foreign key (wisata_id) references wisata (id)
            on delete cascade
)
    collate = utf8mb4_unicode_ci;

INSERT INTO favorit (id, user_id, wisata_id, created_at) VALUES (3, 5, 22, '2026-01-04 12:56:11');
INSERT INTO favorit (id, user_id, wisata_id, created_at) VALUES (13, 10, 17, '2026-01-05 06:08:51');
INSERT INTO favorit (id, user_id, wisata_id, created_at) VALUES (15, 10, 22, '2026-01-05 06:09:58');
INSERT INTO favorit (id, user_id, wisata_id, created_at) VALUES (16, 10, 21, '2026-01-05 06:10:25');
INSERT INTO favorit (id, user_id, wisata_id, created_at) VALUES (17, 10, 23, '2026-01-05 06:10:55');
INSERT INTO favorit (id, user_id, wisata_id, created_at) VALUES (19, 10, 20, '2026-01-05 06:11:14');
INSERT INTO favorit (id, user_id, wisata_id, created_at) VALUES (32, 15, 17, '2026-01-05 14:23:51');
INSERT INTO favorit (id, user_id, wisata_id, created_at) VALUES (40, 17, 17, '2026-01-06 09:41:54');
INSERT INTO favorit (id, user_id, wisata_id, created_at) VALUES (41, 17, 16, '2026-01-06 09:44:45');
INSERT INTO favorit (id, user_id, wisata_id, created_at) VALUES (42, 19, 19, '2026-01-06 16:37:10');
INSERT INTO favorit (id, user_id, wisata_id, created_at) VALUES (43, 21, 17, '2026-01-08 04:27:16');
INSERT INTO favorit (id, user_id, wisata_id, created_at) VALUES (44, 15, 20, '2026-01-08 09:33:07');
INSERT INTO favorit (id, user_id, wisata_id, created_at) VALUES (48, 31, 20, '2026-01-08 15:10:55');
INSERT INTO favorit (id, user_id, wisata_id, created_at) VALUES (50, 38, 16, '2026-01-09 10:15:42');

SET FOREIGN_KEY_CHECKS=1;
