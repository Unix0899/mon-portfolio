# Extract from the Reddit collection script (ScrapperReddit.py) — API credentials removed
reddit = praw.Reddit(client_id="•••", client_secret="•••", user_agent="cryptobel_data_scraper")
subreddit = reddit.subreddit("CryptoFr+BitcoinFrance")
min_score, max_comments = 3, 10

for post in subreddit.new(limit=200):
    post_date = datetime.fromtimestamp(post.created_utc)
    # keep only relevant, popular, recent posts
    if any(kw in post.title.lower() for kw in keywords) \
            and post.score >= min_score and post_date >= date_limite:
        cursor.execute("INSERT OR IGNORE INTO posts VALUES (?, ?, ?, ?)",
                       (post.id, post.title, post.score, post_date.isoformat()))

        post.comments.replace_more(limit=0)
        for comment in post.comments.list()[:max_comments]:
            comment_date = datetime.fromtimestamp(comment.created_utc)
            cursor.execute("INSERT OR IGNORE INTO comments VALUES (?, ?, ?, ?, ?)",
                           (comment.id, post.id, comment.body,
                            comment.score, comment_date.isoformat()))
conn.commit()
