
import asyncio
import time
import instaloader
import argparse
import json
import argparse

# create an argument parser
parser = argparse.ArgumentParser()

# add an argument for the password
parser.add_argument('--password', type=str, help='Instagram password')

# parse the arguments
args = parser.parse_args()

# get the password from the arguments
password = args.password


async def download(account):
    #profile = request.args.get('profile')

    # Get instance
    L = instaloader.Instaloader(download_pictures=True, download_videos=False, download_video_thumbnails=False,
                            download_geotags=False, download_comments=False, save_metadata=False)

    # Optionally, login or load session
    password = args.password
    L.login('alimaslax2', password)
    # L.interactive_login(USER)      # (ask password on terminal)
    # L.load_session_from_file(USER) # (load session created w/
                                #  `instaloader -l USERNAME`)

    # Obtain profile metadata
    profile = instaloader.Profile.from_username(L.context, account)

    # Get the URLs of the latest 20 pictures
    urls = []
    for post in profile.get_posts():
        if len(urls) > 20:
            break
        urls.append(post.url)
    
    # Create a dictionary with a key "urls" and assign the list of URLs to its corresponding value
    data = {"urls": urls}
    # Return the list of URLs as a JSON response
    return data

async def cli(profile):
    print(f"started at {time.strftime('%X')}")
    # loop through the links and download the videos
    try:
        # Set a 30 second timeout for the download coroutine
        urls = await asyncio.wait_for(download(profile), timeout=30)
        print(f"finished at {time.strftime('%X')}")
        return urls
    except:
        print("Timeout")
        # If the download takes more than 20 seconds, read the links from the links.txt file
        with open('links.txt', 'r') as f:
            links = f.readlines()
            urls = [link.strip() for link in links]

        # Create a dictionary with a key "urls" and assign the list of URLs to its corresponding value
        data = {"urls": urls}
        print(f"finished at {time.strftime('%X')}")
        return data

def app(environ, start_response):
    # Get the request payload
    length = int(environ.get('CONTENT_LENGTH', '0'))

    profile = environ.get('QUERY_STRING').split('=', 1)[1]
    print("query "+ profile)

    # Run the main function
    response = main(profile)
    status = '200 OK'
    print(response)
    # Set the response headers
    response_headers = [('Content-Type', 'application/json')]
    start_response(status, response_headers)

    # Convert the dictionary to a JSON-encoded string
    response_body = json.dumps(response)

    # Return the response body as a bytes object
    return [response_body.encode('utf-8')]

def main(profile):
    return asyncio.run(cli(profile))

main('celtics')