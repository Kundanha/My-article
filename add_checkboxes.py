import re

with open('/Users/kundanjha/Projects/My-article/bytebytego.html', 'r') as f:
    content = f.read()

# Find all sections and add checkboxes
sections = [
    'databases', 'replication', 'caching', 'spof', 'memcache', 
    'load-balancing', 'sticky-sessions', 'cdn', 'scaling-strategies',
    'endianness', 'event-sourcing', 'udp', 'push-notifications', 
    'git-internals', 'http-cookies', 'kafka', 'grpc', 'polling-webhooks',
    'graphql', 'data-pipelines', 'api-vs-sdk', 'ssh', 'nginx', 
    'sql-components', 'frontend-perf', 'proxy-gateway-lb', 'vpn',
    'devsecops', 'kubernetes', 'http-status', 'semver', 'ipv4-ipv6',
    'api-auth', 'youtube-design', 'arch-patterns', 'uml-class',
    'web-app-components', 'bff-pattern', 'references'
]

for section_id in sections:
    # Pattern to find section header without checkbox
    old_pattern = f'<section class="section" id="{section_id}">'
    new_pattern = f'<section class="section" id="{section_id}" data-topic-id="{section_id}">'
    content = content.replace(old_pattern, new_pattern)
    
    # Find the section-title closing and add checkbox before </div>
    # Pattern: section-title">TITLE</h2>\n            </div>
    pattern = rf'(id="{section_id}"[^>]*>[\s\S]*?<h2 class="section-title">[^<]+</h2>)(\s*</div>)'
    
    checkbox = f'''
                <label class="topic-checkbox" title="Mark as completed">
                    <input type="checkbox" onchange="toggleTopicComplete('{section_id}', this.checked)">
                    <span class="checkmark"></span>
                </label>'''
    
    replacement = rf'\1{checkbox}\2'
    content = re.sub(pattern, replacement, content, count=1)

with open('/Users/kundanjha/Projects/My-article/bytebytego.html', 'w') as f:
    f.write(content)

print("Done! Checkboxes added to all sections.")
