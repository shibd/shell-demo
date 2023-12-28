document.getElementById('getDiff').addEventListener('click', async () => {
    const res = await fetch('/api/diff');
    const diffHtml = await res.text();
    document.getElementById('output').innerHTML = diffHtml;

    // 移除不需要的元素
    document.querySelectorAll('.d2h-file-header, .d2h-file-list-wrapper').forEach(el => el.remove());
});
