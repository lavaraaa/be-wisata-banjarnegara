SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS komentar;

create table komentar
(
    id         int auto_increment
        primary key,
    user_id    int                                 not null,
    wisata_id  int                                 not null,
    isi        text                                not null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    parent_id  int                                 null,
    constraint fk_komentar_parent
        foreign key (parent_id) references komentar (id)
            on delete cascade,
    constraint fk_komentar_user
        foreign key (user_id) references users (id)
            on delete cascade,
    constraint fk_komentar_wisata
        foreign key (wisata_id) references wisata (id)
            on delete cascade
)
    collate = utf8mb4_unicode_ci;

INSERT INTO komentar (id, user_id, wisata_id, isi, created_at, parent_id) VALUES (6, 17, 16, 'seger banget ciblon disini', '2026-01-06 09:45:09', null);
INSERT INTO komentar (id, user_id, wisata_id, isi, created_at, parent_id) VALUES (7, 19, 19, 'sejuk mas', '2026-01-06 16:37:39', null);
INSERT INTO komentar (id, user_id, wisata_id, isi, created_at, parent_id) VALUES (8, 15, 16, 'boljug mas', '2026-01-08 09:40:19', 6);
INSERT INTO komentar (id, user_id, wisata_id, isi, created_at, parent_id) VALUES (9, 15, 16, 'besok otw', '2026-01-08 09:40:45', 6);
INSERT INTO komentar (id, user_id, wisata_id, isi, created_at, parent_id) VALUES (11, 31, 20, 'Bagus ', '2026-01-08 15:11:03', null);

SET FOREIGN_KEY_CHECKS=1;
