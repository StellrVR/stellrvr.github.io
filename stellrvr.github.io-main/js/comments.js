const MONTH_STRINGS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const URL_PARAMS = new URLSearchParams(window.location.search);
window.history.replaceState({}, document.title, location.pathname);

const getReplyLevel = (number) => {
    let nextElement = null;

    let currentNumber = number;

    let count = 0;

    while (true) {
        nextElement = document.getElementById(`comment${currentNumber}`);

        if (!nextElement) return count;

        count++;

        if (!nextElement.dataset.replies) return count;

        currentNumber = nextElement.dataset.replies;
    }
}

const addPostButton = () => {
    const postButton = document.createElement('button');
    postButton.innerText = '＋ Post a comment';

    postButton.addEventListener('click', (e) => {
        document.getElementById('post').removeAttribute('class');
        postButton.remove();
    });

    document.getElementById('comments').prepend(postButton);
}

const loadComments = () => {
    fetch(`https://radish.place/comments/list/${PUBLIC_KEY}`).then((response) => response.json()).then((json) => {
        document.getElementById('loadComments').remove();

        json.forEach((comment) => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.id = `comment${comment.id}`;
            commentElement.style.setProperty('--level', getReplyLevel(comment.reply));
            commentElement.dataset.replyCount = 0;

            const commentBox = document.createElement('div');
            commentBox.className = 'comment-box';

            const leftElement = document.createElement('div');
            leftElement.className = 'comment-left';

            const infoElement = document.createElement('div');
            infoElement.className = 'comment-info';

            const nameElement = document.createElement('b');

            if (comment.name === '$owner_placeholder') {
                nameElement.innerText = 'July ★'; // Change this to whatever you want to show for verified messages
                nameElement.className = 'comment-owner';
            } else {
                nameElement.innerText = comment.name;
            }

            const dateString = comment.date.toString();

            const year = dateString.substring(0, 4);
            const month = dateString.substring(4, 6);
            const day = parseInt(dateString.substring(6, 8));

            let dayString = 'th';

            if (day % 10 === 1) dayString = 'st';
            if (day % 10 === 2) dayString = 'nd';
            if (day % 10 === 3) dayString = 'rd';

            let monthString = MONTH_STRINGS[parseInt(month) - 1];    

            const dateElement = document.createElement('span');
            dateElement.innerText = ` - ${day}${dayString} of ${monthString}, ${year}`;

            infoElement.appendChild(nameElement);
            infoElement.appendChild(dateElement);

            const messageElement = document.createElement('div');
            messageElement.className = 'comment-message';
            messageElement.innerText = comment.message;

            leftElement.appendChild(infoElement);
            leftElement.appendChild(messageElement);

            const rightElement = document.createElement('span');
            rightElement.className = 'comment-right';

            const deleteElement = document.createElement('a');
            deleteElement.href = '#';
            deleteElement.innerText = 'Delete';
            deleteElement.className = 'comment-delete';

            const replyElement = document.createElement('a');
            replyElement.href = '#';
            replyElement.innerText = 'Reply';
            replyElement.className = 'comment-reply';

            rightElement.appendChild(deleteElement);
            rightElement.appendChild(replyElement);

            commentBox.appendChild(leftElement);
            commentBox.appendChild(rightElement);

            const replyBox = document.createElement('div');
            replyBox.className = 'reply-box';

            commentElement.appendChild(commentBox);
            commentElement.appendChild(replyBox);

            if (comment.reply) {
                commentElement.classList.add('reply');
                commentElement.dataset.replies = comment.reply;

                const repliedComment = document.getElementById(`comment${comment.reply}`);

                if (repliedComment) {
                    repliedComment.childNodes[1].prepend(commentElement);
                    repliedComment.dataset.replyCount++;
                }
            } else {
                document.getElementById('comments').prepend(commentElement);
            }

            deleteElement.addEventListener('click', (e) => {
                const privateKey = window.prompt('Private key?');

                fetch(`https://radish.place/comments/delete/${PUBLIC_KEY}/${comment.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        privateKey: privateKey
                    })
                }).then((response) => {
                    if (response.ok) {
                        alert('Comment deleted!');
                    } else {
                        response.text().then((text) => {
                            alert(`${response.status} error: ${text}`);
                        });
                    }
                });
            });

            replyElement.addEventListener('click', (e) => {
                const replyDiv = document.getElementById('reply');
                replyDiv.remove();
                commentElement.childNodes[0].appendChild(replyDiv);

                document.getElementById('replyName').innerText = comment.name;
                document.getElementById('replyForm').action = `https://radish.place/comments/reply/${PUBLIC_KEY}/${comment.id}`;
                document.getElementById('reply').removeAttribute('class');
                
                replyElement.classList.add('replying');
            });
        });

        addPostButton();

        if (URL_PARAMS.has('success') && parseInt(URL_PARAMS.get('success'))) {
            const successes = URL_PARAMS.getAll('success');

            document.getElementById(`comment${successes[successes.length - 1]}`).classList.add('comment-highlight');

            document.getElementById(`comment${successes[successes.length - 1]}`).scrollIntoView({
                'block': 'center',
                'inline': 'center'
            });
        }

        if (URL_PARAMS.has('failure')) {
            document.getElementById('statusMessage').scrollIntoView({
                'block': 'center',
                'inline': 'center'
            });
        }
    });
}

fetch(`https://radish.place/comments/count/${PUBLIC_KEY}`).then((response) => {
    if (response.ok) {
        response.text().then((text) => {
            const count = parseInt(text);

            if (parseInt(text) > 0) {
                document.getElementById('comments').replaceChildren();
                document.getElementById('loadComments').innerText = `Load ${count} comment${count === 1 ? '' : 's'}`;

                document.getElementById('loadComments').addEventListener('click', (e) => {
                    loadComments();
                });
            } else {
                document.getElementById('comments').innerText = 'This article has no comments.';
                document.getElementById('loadComments').remove();

                addPostButton();
            }
        });

        if (URL_PARAMS.has('success')) {
            document.getElementById('statusMessage').innerText = 'Comment posted!\n';
        
            document.getElementById('statusMessage').classList.add('success');
        
            loadComments();
        }
        
        if (URL_PARAMS.has('failure')) {
            if (URL_PARAMS.get('failure') === 'language') document.getElementById('statusMessage').innerText = 'No derogatory language.\n';
            if (URL_PARAMS.get('failure') === 'symbols') document.getElementById('statusMessage').innerText = 'Comment messages cannot contain @, ;, >, {, }, or \\.\n';
            if (URL_PARAMS.get('failure') === 'repost') document.getElementById('statusMessage').innerText = 'This message has already been posted.\n';
        
            document.getElementById('statusMessage').classList.add('failure');
        
            loadComments();
        }
    } else {
        response.text().then((text) => {
            document.getElementById('comments').innerText = `${response.status} error: ${text}`;
            document.getElementById('loadComments').remove();
        });
    }
});