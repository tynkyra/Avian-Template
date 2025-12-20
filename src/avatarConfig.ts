// Shared avatar configuration
export const avatarLibrary = [
  // Gundam Models (10 total)
  {
    id: "Grandpa",
    name: "RX-78-2 Gundam",
    image: "https://m.media-amazon.com/images/I/511hhV-IVzL._AC_UF894,1000_QL80_.jpg",
    category: "Gundam"
  },
  {
    id: "Sazabi",
    name: "MSN-04 Sazabi",
    image: "https://cdnb.artstation.com/p/assets/images/images/059/201/687/large/thomas-fleury-sazabi.jpg?1675864924",
    category: "Gundam"
  },
  {
    id: "Nu-Gundam",
    name: "RX-93 Nu Gundam",
    image: "https://yoshstudios.com/wp-content/uploads/2025/08/Render_01-1.jpg",
    category: "Gundam"
  },
  {
    id: "Barbatos",
    name: "ASW-G-08 Gundam Barbatos",
    image: "https://avatarfiles.alphacoders.com/378/378158.png",
    category: "Gundam"
  },
  {
    id: "Wing-Zero",
    name: "XXXG-00W0 Wing Gundam Zero",
    image: "https://www.gunjap.net/site/wp-content/uploads/2020/04/C9E85F15-DEEE-49A0-971D-322C3302CA07.jpeg",
    category: "Gundam"
  },
  {
    id: "Strike-Freedom",
    name: "ZGMF-X20A Strike Freedom",
    image: "https://images7.alphacoders.com/124/1243002.jpg",
    category: "Gundam"
  },
  {
    id: "Zaku-II",
    name: "MS-06 Zaku II",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSATITRB5cJ76HtwG82036KRi49WHBOIVxG2Q&s",
    category: "Gundam"
  },
  {
    id: "Exia",
    name: "GN-001 Gundam Exia",
    image: "https://i.pinimg.com/474x/7f/d2/9a/7fd29a6ae9f141feec1eef99783f3bf7.jpg",
    category: "Gundam"
  },
  {
    id: "Unicorn",
    name: "RX-0 Unicorn Gundam",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKllQOwtk5xt1tWHbCe6msij6MerAkrJcUYg&s",
    category: "Gundam"
  },
  {
    id: "Astray-Red",
    name: "MBF-P02 Gundam Astray Red Frame",
    image: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/7412ae67730913.5b4475d4ea08a.jpg",
    category: "Gundam"
  },
  // Pokemon (9 total)
  {
    id: "Pikachu",
    name: "Pikachu",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-UVcF-Ajwj5B0zkqNW97jBGO_kbWulw7KsA&s",
    category: "Pokemon"
  },
  {
    id: "Snorlax",
    name: "Snorlax",
    image: "https://cdn.dribbble.com/userupload/21468479/file/original-cd73ae534c20b3129380bdd628cc08c8.gif",
    category: "Pokemon"
  },
  {
    id: "Gardevoir",
    name: "Gardevoir",
    image: "https://avatarfiles.alphacoders.com/375/thumb-1920-375356.png",
    category: "Pokemon"
  },
  {
    id: "Ceruledge",
    name: "Ceruledge",
    image: "https://pbs.twimg.com/media/FkBiL0eXkAEMRZq.png",
    category: "Pokemon"
  },
  {
    id: "Rowlett",
    name: "Rowlett",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQN0N6XVFBmfmvq-Y7Qb-DexVxdm6kHJIaJkg&s",
    category: "Pokemon"
  },
  {
    id: "Decidueye",
    name: "Decidueye",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSSNS76LF6xwzHHyN44OaAm7df9X-ZXn8JMA&s",
    category: "Pokemon"
  },
  {
    id: "Garchomp",
    name: "Garchomp",
    image: "https://i.pinimg.com/736x/8b/1e/4f/8b1e4f2de83c151e642e9f8299e225f1.jpg",
    category: "Pokemon"
  },
  {
    id: "Rayquaza",
    name: "Rayquaza",
    image: "https://avatarfiles.alphacoders.com/376/thumb-1920-376165.png",
    category: "Pokemon"
  },
  {
    id: "Dialga",
    name: "Dialga",
    image: "https://pm1.aminoapps.com/6130/b75a109d5e540c97754bcecb42f79ca11a19ae9d_hq.jpg",
    category: "Pokemon"
  }
];

// Helper function to get avatar image by ID
export const getAvatarImageById = (avatarId: string) => {
  const avatar = avatarLibrary.find(a => a.id === avatarId);
  return avatar ? avatar.image : avatarLibrary[0].image;
};

// Helper function to get avatar name by ID
export const getAvatarNameById = (avatarId: string) => {
  const avatar = avatarLibrary.find(a => a.id === avatarId);
  return avatar ? avatar.name : avatarLibrary[0].name;
};

// Helper function to get avatar ID from URL
export const getAvatarIdFromUrl = (url: string): string => {
  if (!url) return 'Unknown';
  
  // Handle data URLs (custom uploads)
  if (url.toLowerCase().startsWith('data:')) {
    return 'Custom';
  }
  
  // Find avatar by matching URL
  const matchedAvatar = avatarLibrary.find(avatar => 
    avatar.image.toLowerCase() === url.toLowerCase()
  );
  
  if (matchedAvatar) {
    return matchedAvatar.id;
  }
  
  // If no exact match, try partial matching
  for (const avatar of avatarLibrary) {
    // Extract unique parts from both URLs for comparison
    const avatarUrlParts = avatar.image.toLowerCase().split('/').filter(p => p.length > 3);
    const inputUrlParts = url.toLowerCase().split('/').filter(p => p.length > 3);
    
    // Check if there's significant overlap
    const hasMatch = avatarUrlParts.some(part => 
      inputUrlParts.some(inputPart => 
        inputPart.includes(part) || part.includes(inputPart)
      )
    );
    
    if (hasMatch) {
      return avatar.id;
    }
  }
  
  return 'Unknown';
};
