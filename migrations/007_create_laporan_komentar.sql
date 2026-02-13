SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS laporan_komentar;

create table laporan_komentar
(
    id            int auto_increment
        primary key,
    komentar_id   int                                 not null,
    pelapor_id    int                                 not null,
    alasan        text                                null,
    tanggal_lapor timestamp default CURRENT_TIMESTAMP not null,
    constraint komentar_id
        unique (komentar_id, pelapor_id),
    constraint laporan_komentar_ibfk_1
        foreign key (komentar_id) references komentar (id)
            on delete cascade,
    constraint laporan_komentar_ibfk_2
        foreign key (pelapor_id) references users (id)
            on delete cascade
)
    collate = utf8mb4_unicode_ci;

create index pelapor_id
    on laporan_komentar (pelapor_id);


SET FOREIGN_KEY_CHECKS=1;
