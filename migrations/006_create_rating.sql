SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS rating;

create table rating
(
    id         int auto_increment
        primary key,
    user_id    int                                 not null,
    wisata_id  int                                 not null,
    rating     tinyint                             not null,
    review     text                                null,
    images     longtext                            null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    constraint uk_user_wisata
        unique (user_id, wisata_id),
    constraint rating_ibfk_1
        foreign key (user_id) references users (id)
            on delete cascade,
    constraint rating_ibfk_2
        foreign key (wisata_id) references wisata (id)
            on delete cascade
)
    collate = utf8mb4_unicode_ci;

create index wisata_id
    on rating (wisata_id);

INSERT INTO rating (id, user_id, wisata_id, rating, review, images, created_at) VALUES (18, 1, 19, 5, '', '["1767616759441-5154.jpg"]', '2026-01-05 12:39:22');

SET FOREIGN_KEY_CHECKS=1;
