type AppRole = "STUDENT" | "TEACHER_ADMIN";

//in loc sa creez un array in principal sidebar de fiecare data
// sa creat aici un file aparte(constants) de unde va fi apelat in sidebar
export const sidebarLinks = [
    {
        label: 'Acasă',
        route: '/',
        imgUrl: '/icons/home.png',
    },
    {
        label: 'Urmează',
        route: '/upcoming',
        imgUrl: '/icons/angle-double-right.png',
    },
    {
        label: 'Anterioare',
        route: '/previous',
        imgUrl: '/icons/angle-double-left.png',
    },
    {
        label: 'Înregistrări',
        route: '/recordings',
        imgUrl: '/icons/video-camera-alt.png',
    },
    {
        label: 'Camera personală',
        route: '/personal-room',
        imgUrl: '/icons/plus.png',
    },
    {
        label: 'Grupele mele',
        route: '/teacher/groups',
        imgUrl: '/icons/users-alt.png',
        roles: ['TEACHER_ADMIN'] as AppRole[],
    },
    {
        label: 'Cărți',
        route: '/teacher/books',
        imgUrl: '/icons/book-open-cover.png',
        roles: ['TEACHER_ADMIN'] as AppRole[],
    },
    {
        label: 'Fișe',
        route: '/teacher/worksheets',
        imgUrl: '/icons/edit.png',
        roles: ['TEACHER_ADMIN'] as AppRole[],
    },
    {
        label: 'Note',
        route: '/teacher/grades',
        imgUrl: '/icons/graduation-cap.png',
        roles: ['TEACHER_ADMIN'] as AppRole[],
    },
    {
        label: 'Grupul meu',
        route: '/student/group',
        imgUrl: '/icons/users-alt.png',
        roles: ['STUDENT'] as AppRole[],
    },
    {
        label: 'Cărțile mele',
        route: '/student/books',
        imgUrl: '/icons/book-open-cover.png',
        roles: ['STUDENT'] as AppRole[],
    },
    {
        label: 'Fișele mele',
        route: '/student/worksheets',
        imgUrl: '/icons/edit.png',
        roles: ['STUDENT'] as AppRole[],
    },
    {
        label: 'Lecțiile mele',
        route: '/student/lessons',
        imgUrl: '/icons/computer.png',
        roles: ['STUDENT'] as AppRole[],
    },
    {
        label: 'Notele mele',
        route: '/student/grades',
        imgUrl: '/icons/graduation-cap.png',
        roles: ['STUDENT'] as AppRole[],
    },
]
