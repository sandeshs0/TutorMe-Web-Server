import matplotlib.pyplot as plt
from wordcloud import WordCloud

# Define the words for the word cloud with fewer keywords
word_freq = {
    "Political": 80,
    "Sentiment": 100,
    "Analysis": 60,
    "Machine Learning": 50,
    "NLP": 40,
    "Opinion": 70,
}

# Generate the word cloud
wordcloud = WordCloud(width=800, height=400, background_color="white", colormap="cool", 
                      prefer_horizontal=1.0).generate_from_frequencies(word_freq)

# Display the word cloud
plt.figure(figsize=(8, 4))
plt.imshow(wordcloud, interpolation="bilinear")
plt.axis("off")
plt.title("Political Sentiment Analysis Word Cloud", fontsize=14)

# Save the image
plt.savefig("wordcloud.png", bbox_inches='tight')
plt.show()
