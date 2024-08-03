export default function () {
    return (
        Date.now().toString() +
        (Math.random() * 1000).toString().substring(0, 3)
    );
}
